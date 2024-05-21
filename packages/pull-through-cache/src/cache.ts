import {
	millisecondsTillTimestamp,
	selectNextTimestamp,
	sortEvictTimestamps,
} from "./evict-timestamp.js";
import type { EvictTimestamp } from "./evict-timestamp.js";

export type CacheFetcherFn<KeyType, ValueType> = (
	cache: PullThroughCache<KeyType, ValueType>,
	key: KeyType,
) => Promise<ValueType> | ValueType;

export type CacheSamplerFn<KeyType, ValueType> = (
	key: KeyType,
	value: ValueType,
) => Promise<CacheSamplerResult> | CacheSamplerResult;

type CacheSamplerResult = "expire" | "keep";

/**
 * Create a new typed pull-through-cache. Note that the cache will also cache `undefined`
 * values from the fetcher. So either include `undefined` in the provided generic argument,
 * or make sure that the provided `fetcher` to {@link PullThroughCache.withFetcher} doesn't
 * return
 * `undefined`.
 *
 * If no TTL, evict timestamps or sampler is set, the cache stores values indefinitely. In
 * those cases, it might be better to use a `new Map()` instead.
 *
 * Note that if you create local caches for requests or other units of work with {@link
 * PullThroughCache.withEvictTimestamps}, make sure to call {@link PullThroughCache.disable}
 * before it goes out of scope. This clears all caches, timers, etc. So the garbage-collector can
 * clean this instance up.
 */
export class PullThroughCache<KeyType, ValueType = never> {
	#enabled = true;

	#valueMap = new Map<KeyType, ValueType>();

	#ttl?: number;
	#ttlMap = new Map<KeyType, number>();

	#stepValue?: number;
	#randomValue?: number;
	#sampler: CacheSamplerFn<KeyType, ValueType> = () => {
		throw new Error(
			"Uninitialized sampler. This shouldn't happen. Please report an issue.",
		);
	};
	#stepCounter = 0;

	#evictTimestamps: Array<EvictTimestamp> = [];
	#evictTimeout?: NodeJS.Timeout;

	#fetcher: CacheFetcherFn<KeyType, ValueType> = () => {
		throw new Error("Make sure to call '.withFetcher()' before using the cache.");
	};

	/**
	 * Expire cached entries once they are in the cache for `opts.ttl` milliseconds. When
	 * {@link PullThroughCache.get} is called on an expired entry, the provided `fetcher` is
	 * called.
	 */
	withTTL(opts: { ttl: number }): PullThroughCache<KeyType, ValueType> {
		this.#ttl = opts.ttl;
		return this;
	}

	/**
	 * Sample {@link PullThroughCache.get} calls to check if the value is outdated. This method
	 * supports either step-based sampling or random-based sampling, based on the uniform
	 * distribution of
	 * {@link Math.random}.
	 *
	 * If the 'opts.stepValue' option is provided, each call to {@link PullThroughCache.get}
	 * increments a cache-instance-based counter. If `$counter % stepValue === 0`, the sampler
	 * is
	 * called.
	 *
	 * If `opts.randomValue` option is provided, each call to `cache.get()` executes a {@link
	 * Math.random} call to retrieve a `$random`. When `$random < $randomValue`, the sampler is
	 * called.
	 *
	 * The sampler is called with both the cache key and cached value. When the sampler returns
	 * `expire`, the `fetcher` set by {@link PullThroughCache.withFetcher} will be called to
	 * retrieve the new value.
	 */
	withUpdatedSampler(opts: {
		stepValue?: number;
		randomValue?: number;
		sampler: CacheSamplerFn<KeyType, ValueType>;
	}): PullThroughCache<KeyType, ValueType> {
		if (opts.stepValue === undefined && opts.randomValue === undefined) {
			throw new Error("Either 'stepValue' or 'randomValue' must be provided.");
		}

		if (opts.stepValue !== undefined && opts.randomValue !== undefined) {
			throw new Error("Either 'stepValue' or 'randomValue' should be provided.");
		}

		if (
			opts.stepValue !== undefined &&
			(!Number.isInteger(opts.stepValue) || opts.stepValue <= 0)
		) {
			throw new Error("'stepValue' must be a positive integer.");
		}

		if (
			opts.randomValue !== undefined &&
			(opts.randomValue < 0 || opts.randomValue > 1)
		) {
			throw new Error("'randomValue' must be between 0 and 1.");
		}

		this.#stepValue = opts.stepValue;
		this.#randomValue = opts.randomValue;
		this.#sampler = opts.sampler;

		return this;
	}

	/**
	 * Evict all cached entries on the provided hours and minutes combinations.
	 * The cache automatically sorts the provided array and takes the first suitable entry to
	 * wait for. It automatically wraps around to the next day.
	 *
	 * Note that it uses a single background timer to execute this functionality. {@link
	 * NodeJS.Timer.unref} is called on the timer, so it doesn't hold up the process.
	 */
	withEvictTimestamps(opts: {
		timestamps: Array<EvictTimestamp>;
	}): PullThroughCache<KeyType, ValueType> {
		this.#evictTimestamps = sortEvictTimestamps(opts.timestamps);
		this.#scheduleNextEvict();

		return this;
	}

	/**
	 * Set the fetcher to be called when an unknown or expired key is used in {@link
	 * PullThroughCache.get}.
	 *
	 * If {@link PullThroughCache.get} is called, before the `fetcher` is set, the cache will
	 * throw an error.
	 */
	withFetcher(opts: {
		fetcher: CacheFetcherFn<KeyType, ValueType>;
	}): PullThroughCache<KeyType, ValueType> {
		this.#fetcher = opts.fetcher;

		return this;
	}

	/**
	 * Retrieve a value from the cache. May call both the `sampler` from {@link
	 * PullThroughCache.withUpdatedSampler} as well as the `fetcher` from {@link
	 * PullThroughCache.withFetcher}.
	 */
	async get(key: KeyType): Promise<ValueType> {
		if (!this.isEnabled()) {
			return this.#fetcher(this, key);
		}

		this.#clearKeyOnTTLExpiry(key);

		if (this.#valueMap.has(key)) {
			// We promise Typescript that the value is not null. However, we don't know and frankly
			// don't care if the user wants to store undefined or null in the cache. We already
			// checked with `Map#has` if a value is cached.
			const value = this.#valueMap.get(key)!;

			const samplerResult = await this.#sampleKey(key, value);
			if (samplerResult === "keep") {
				return value;
			}

			// Value is expired, clear and fall-through to the fetcher.
			this.#clearKey(key);
		}

		const value = await this.#fetcher(this, key);
		this.#setKey(key, value);

		return value;
	}

	/**
	 * Retrieve all non-expired values in the cache. This acts on expired TTL values if {@link
	 * PullThroughCache.withTTL} is used. However, it ignores the sampler from {@link
	 * PullThroughCache.withUpdatedSampler}.
	 */
	getAll(): Array<ValueType> {
		this.#clearAllExpiredTTLKeys();
		return [...this.#valueMap.values()];
	}

	/**
	 * Set many entries in the cache. This can be used if you know that certain related keys
	 * should be cached as well in a `fetcher` call. Note that if you use this call in the
	 * `fetcher`, you still need to return the individual value. If you use {@link
	 * PullThroughCache.get} in the fetcher to retrieve this value, you might get an infinite
	 * recursive loop if the `setMany` call does not include your key or when the cache is
	 * disabled.
	 *
	 * @example
	 * ```ts
	 * import { PullThroughCache } from "@lightbase/pull-through-cache";
	 *
	 * const cache = new PullThroughCache<FeatureFlags, FeatureFlagIdentifiers>()
	 *  .withTTL({ ttl: 5 * 60 * 1000 })
	 *  .withFetcher({
	 *    async fetcher(cache, key) {
	 *      const allFlags = await retrieveAllFeatureFlagsSomehow();
	 *      cache.setMany(flags.map((it) => [it.identifier, it]));
	 *
	 *      // Make sure that we have the asked for key as well
	 *      const thisFlag = allFlags.find((it) => it.identifier === key);
	 *      assertNotNil(thisFlag);
	 *
	 *      return thisFlag;
	 *    },
	 *  });
	 * ```
	 */
	setMany(entries: Array<[KeyType, ValueType]>) {
		if (!this.isEnabled()) {
			return;
		}

		for (const [key, value] of entries) {
			this.#setKey(key, value);
		}
	}

	/**
	 * Retrieve if the cache is enabled or disabled. By default, the cache is enabled. A
	 * disabled
	 * cache will use the `fetcher` on each invocation of {@link PullThroughCache.get}. Other
	 * calls are practically no-ops:
	 *
	 * - `cache.getAll()` will always return an empty list
	 * - `cache.setMany()` will ignore the provided entries.
	 */
	isEnabled(): boolean {
		return this.#enabled;
	}

	/**
	 * Enable the cache. If the cache is already enabled, this call is a no-op.
	 */
	enable() {
		this.#enabled = true;
		this.#scheduleNextEvict();
	}

	/**
	 * Disable the cache. On invocation, the cache will evict all its entries. See
	 * {@link PullThroughCache.isEnabled} for behavior of the other methods.
	 */
	disable() {
		this.#enabled = false;
		this.#clear();
	}

	#setKey(key: KeyType, value: ValueType) {
		this.#valueMap.set(key, value);

		if (this.#ttl !== undefined) {
			this.#ttlMap.set(key, Date.now() + this.#ttl);
		}
	}

	#clear() {
		this.#valueMap.clear();
		this.#ttlMap.clear();
		this.#stepCounter = 0;
		clearTimeout(this.#evictTimeout);
	}

	#clearKey(key: KeyType) {
		this.#valueMap.delete(key);
		this.#ttlMap.delete(key);
	}

	#clearKeyOnTTLExpiry(key: KeyType) {
		if (this.#ttl === undefined) {
			return;
		}

		const ttl = this.#ttlMap.get(key);
		if (ttl === undefined) {
			return;
		}

		if (ttl < Date.now()) {
			this.#clearKey(key);
		}
	}

	#clearAllExpiredTTLKeys() {
		if (this.#ttl === undefined) {
			return;
		}

		const now = Date.now();

		for (const key of this.#valueMap.keys()) {
			const ttl = this.#ttlMap.get(key);
			if (ttl === undefined) {
				// TTL setting is defined after we create the value, clear the value.
				this.#valueMap.delete(key);
				return;
			}

			if (ttl < now) {
				this.#clearKey(key);
			}
		}
	}

	#sampleKey(
		key: KeyType,
		value: ValueType,
	): Promise<CacheSamplerResult> | CacheSamplerResult {
		this.#stepCounter++;
		if (this.#stepCounter === Number.MAX_SAFE_INTEGER) {
			// Wrap around, to stay in the safe integer ranges. This means that if the `stepValue` is
			// used, the sampler will always be called, since `0 % N` is always 0.
			this.#stepCounter = 0;
		}

		if (this.#stepValue === undefined && this.#randomValue === undefined) {
			return "keep";
		}

		if (this.#stepValue !== undefined && this.#stepCounter % this.#stepValue === 0) {
			return this.#sampler(key, value);
		}

		if (this.#randomValue !== undefined && Math.random() < this.#randomValue) {
			return this.#sampler(key, value);
		}

		return "keep";
	}

	#scheduleNextEvict() {
		const d = new Date();
		const nextTimestamp = selectNextTimestamp(
			this.#evictTimestamps,
			d.getUTCHours(),
			d.getUTCMinutes(),
		);

		if (nextTimestamp === undefined) {
			return;
		}

		const milliseconds = millisecondsTillTimestamp(nextTimestamp);

		// Start the timer. We 'unref' it so this timer doesn't prevent a process from shutting
		// down.
		this.#evictTimeout = setTimeout(this.#runEvict.bind(this), milliseconds);
		this.#evictTimeout.unref();
	}

	#runEvict() {
		this.#clear();
		this.#scheduleNextEvict();
	}
}
