import assert from "node:assert/strict";
import { test, mock } from "node:test";
import { PullThroughCache } from "../src/index.js";
import type { CacheSamplerFn } from "../src/index.js";
import type { CacheFetcherFn } from "../src/index.js";

function testCache(fetcher?: CacheFetcherFn<number, number | undefined>) {
	fetcher ??= (_cache, key) => key;
	const mockedFetcher = mock.fn(fetcher);
	const cache = new PullThroughCache<number, number | undefined>().withFetcher({
		fetcher: mockedFetcher as typeof fetcher,
	});

	return {
		cache,
		fetcher: mockedFetcher,
	};
}

function testSampledCache({
	stepValue,
	sampler,
}: {
	stepValue: number;
	sampler: CacheSamplerFn<number, number | undefined>;
}) {
	const { cache, fetcher } = testCache();
	const mockedSampler = mock.fn(sampler);
	cache.withUpdatedSampler({
		sampler: mockedSampler as CacheSamplerFn<number, number | undefined>,
		stepValue,
	});

	return {
		cache,
		fetcher,
		sampler: mockedSampler,
	};
}

void test("can be constructed", () => {
	const ptc = new PullThroughCache();
	assert.ok(ptc);
});

void test("withUpdatedSampler input validation", async (t) => {
	await t.test("throw if both stepValue and randomValue are not provided", () => {
		assert.throws(() => {
			new PullThroughCache().withUpdatedSampler({
				sampler: () => "keep",
			});
		}, /must be provided/);
	});

	await t.test("throw if both stepValue and randomValue are provided", () => {
		assert.throws(() => {
			new PullThroughCache().withUpdatedSampler({
				sampler: () => "keep",
				randomValue: 1,
				stepValue: 1,
			});
		}, /should be provided/);
	});

	await t.test("throw if step value is not an integer", () => {
		assert.throws(() => {
			new PullThroughCache().withUpdatedSampler({
				sampler: () => "keep",
				stepValue: 1.1,
			});
		}, /'stepValue' must be a positive integer/);
	});

	await t.test("throw if step value 0", () => {
		assert.throws(() => {
			new PullThroughCache().withUpdatedSampler({
				sampler: () => "keep",
				stepValue: 0,
			});
		}, /'stepValue' must be a positive integer/);
	});

	await t.test("throw if random value is negative", () => {
		assert.throws(() => {
			new PullThroughCache().withUpdatedSampler({
				sampler: () => "keep",
				randomValue: -1,
			});
		}, /'randomValue' must be between/);
	});

	await t.test("throw if random value is bigger than 1", () => {
		assert.throws(() => {
			new PullThroughCache().withUpdatedSampler({
				sampler: () => "keep",
				randomValue: 1.5,
			});
		}, /'randomValue' must be between/);
	});
});

void test("baseline", async (t) => {
	await t.test("throws if .get() is called without setting a fetcher", async () => {
		const ptc = new PullThroughCache();
		await assert.rejects(async () => {
			await ptc.get("some key");
		}, /Make sure to call '.withFetcher\(\)'/);
	});

	await t.test("call the fetcher on a new key", async () => {
		const { cache, fetcher } = testCache();

		assert.equal(await cache.get(5), 5);

		assert.equal(fetcher.mock.callCount(), 1);
		assert.equal(fetcher.mock.calls[0]?.arguments[0], cache);
		assert.equal(fetcher.mock.calls[0]?.arguments[1], 5);
	});

	await t.test("call the fetcher once for a specific key", async () => {
		const { cache, fetcher } = testCache();

		assert.equal(await cache.get(5), 5);
		assert.equal(await cache.get(5), 5);
		assert.equal(await cache.get(5), 5);

		assert.equal(fetcher.mock.callCount(), 1);
	});

	await t.test("call the fetcher each time if the cache is disabled", async () => {
		const { cache, fetcher } = testCache();

		cache.disable();

		assert.equal(await cache.get(5), 5);
		assert.equal(await cache.get(5), 5);
		assert.equal(await cache.get(5), 5);
		assert.equal(cache.getAll().length, 0);

		assert.equal(fetcher.mock.callCount(), 3);
	});

	await t.test("call the fetcher once per different key", async () => {
		const { cache, fetcher } = testCache();

		assert.equal(await cache.get(5), 5);
		assert.equal(await cache.get(6), 6);
		assert.equal(await cache.get(6), 6);

		assert.equal(fetcher.mock.callCount(), 2);

		assert.equal(fetcher.mock.calls[0]?.arguments[0], cache);
		assert.equal(fetcher.mock.calls[0]?.arguments[1], 5);
		assert.equal(fetcher.mock.calls[1]?.arguments[0], cache);
		assert.equal(fetcher.mock.calls[1]?.arguments[1], 6);
	});

	await t.test("getAll returns the cached values", async () => {
		const { cache } = testCache();

		assert.equal(await cache.get(5), 5);
		assert.deepEqual(cache.getAll(), [5]);
		assert.equal(await cache.get(6), 6);
		assert.deepEqual(cache.getAll(), [5, 6]);
		assert.equal(await cache.get(6), 6);
		assert.deepEqual(cache.getAll(), [5, 6]);
	});

	await t.test("setMany in the fetcher is directly available", async () => {
		const { cache } = testCache((_cache, key) => {
			_cache.setMany(Array.from({ length: 10 }).map((_, idx) => [idx, idx]));
			return cache.get(key);
		});

		assert.equal(await cache.get(1), 1);
		assert.deepEqual(cache.getAll(), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
	});

	await t.test("setMany on a disabled cache doesn't store an entry", async () => {
		const { cache } = testCache((_cache, key) => {
			_cache.setMany(Array.from({ length: 10 }).map((_, idx) => [idx, idx]));

			if (!_cache.isEnabled()) {
				return undefined;
			}

			return cache.get(key);
		});

		cache.disable();

		assert.equal(cache.isEnabled(), false);
		assert.equal(await cache.get(1), undefined);
		assert.equal(cache.getAll().length, 0);
	});

	await t.test("disabling the cache clears all entries", async () => {
		const { cache } = testCache((_cache, key) => {
			_cache.setMany(Array.from({ length: 10 }).map((_, idx) => [idx, idx]));
			return cache.get(key);
		});

		assert.equal(await cache.get(1), 1);
		assert.deepEqual(cache.getAll(), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
		cache.disable();
		assert.equal(cache.getAll().length, 0);
	});

	await t.test("calling 'clearAll' clears all entries", async () => {
		const { cache } = testCache((_cache, key) => {
			_cache.setMany(Array.from({ length: 10 }).map((_, idx) => [idx, idx]));
			return cache.get(key);
		});

		assert.equal(await cache.get(1), 1);
		assert.deepEqual(cache.getAll(), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
		cache.clearAll();
		assert.equal(cache.getAll().length, 0);
	});
});

void test("ttl", async (t) => {
	// Random start date between 0 and 100 seconds
	const now = Math.floor(Math.random() * 100000);
	t.beforeEach(() => {
		mock.timers.enable({
			apis: ["Date"],
			now,
		});
	});
	t.afterEach(() => {
		mock.timers.reset();
	});

	await t.test("without timer advancements, value is cached indefinitely", async () => {
		const { cache, fetcher } = testCache();
		cache.withTTL({
			ttl: 5,
		});

		assert.equal(await cache.get(10), 10);
		assert.equal(await cache.get(10), 10);
		assert.equal(await cache.get(10), 10);
		assert.equal(await cache.get(10), 10);
		assert.equal(await cache.get(10), 10);
		assert.equal(await cache.get(10), 10);
		assert.equal(fetcher.mock.callCount(), 1);
	});

	await t.test(
		"advancing the timer without hitting the TTL does not call the fetcher again",
		async () => {
			const { cache, fetcher } = testCache();
			cache.withTTL({
				ttl: 5,
			});

			assert.equal(await cache.get(11), 11);
			mock.timers.tick(3);
			assert.equal(await cache.get(11), 11);
			assert.equal(fetcher.mock.callCount(), 1);
		},
	);

	await t.test(
		"advancing the timer more than the TTL results another fetcher call.",
		async () => {
			const { cache, fetcher } = testCache();
			cache.withTTL({
				ttl: 5,
			});

			assert.equal(await cache.get(12), 12);
			mock.timers.tick(10);
			assert.equal(await cache.get(12), 12);
			assert.equal(fetcher.mock.callCount(), 2);
		},
	);

	await t.test("getAll does not return TTL expired values", async () => {
		const { cache } = testCache();
		cache.withTTL({
			ttl: 4,
		});

		for (let i = 0; i < 5; ++i) {
			await cache.get(i);
			mock.timers.tick(1);
		}

		assert.deepEqual(cache.getAll(), [1, 2, 3, 4]);
	});

	await t.test("getAll does not return TTL expired values - 2 ticks", async () => {
		const { cache } = testCache();
		cache.withTTL({
			ttl: 4,
		});

		for (let i = 0; i < 5; ++i) {
			await cache.get(i);
			mock.timers.tick(2);
		}

		assert.deepEqual(cache.getAll(), [3, 4]);
	});

	await t.test("values set via setMany also respect the TTL", async () => {
		const { cache } = testCache((_cache, key) => {
			_cache.setMany(Array.from({ length: 10 }).map((_, idx) => [idx, idx]));
			return cache.get(key);
		});
		cache.withTTL({
			ttl: 5,
		});

		await cache.get(1);
		assert.equal(cache.getAll().length, 10);
		mock.timers.tick(10);
		assert.equal(cache.getAll().length, 0);
	});
});

void test("updatedSampler", async (t) => {
	// Note that we skip 'randomValue' sample tests here. Have to figure out a mocking solution
	// or other way to retrieve a random value for that first.

	await t.test(
		"sampler result 'keep' does not result in an extra call to the fetcher",
		async () => {
			const { cache, fetcher, sampler } = testSampledCache({
				stepValue: 1,
				sampler: () => "keep",
			});

			await cache.get(21);
			assert.equal(fetcher.mock.callCount(), 1);
			assert.equal(sampler.mock.callCount(), 0);

			await cache.get(21);
			assert.equal(fetcher.mock.callCount(), 1);
			assert.equal(sampler.mock.callCount(), 1);
		},
	);
	await t.test(
		"sampler result 'expire' results in another call to the fetcher",
		async () => {
			const { cache, fetcher, sampler } = testSampledCache({
				stepValue: 1,
				sampler: () => "expire",
			});

			await cache.get(22);
			assert.equal(fetcher.mock.callCount(), 1);
			assert.equal(sampler.mock.callCount(), 0);

			await cache.get(22);
			assert.equal(fetcher.mock.callCount(), 2);
			assert.equal(sampler.mock.callCount(), 1);
		},
	);

	await t.test("the fetcher is called every 'stepValue' calls", async () => {
		const { cache, fetcher, sampler } = testSampledCache({
			stepValue: 2,
			sampler: () => "expire",
		});

		for (let i = 0; i < 10; ++i) {
			await cache.get(23);
		}

		// Note that if no value is not present, the sampler is not called.
		assert.equal(sampler.mock.callCount(), 4);
		assert.equal(fetcher.mock.callCount(), 5);
	});
});

void test("evict timestamps", async (t) => {
	// Random start date between 0 and 100 seconds a day in advance.
	const now = 24 * 60 * 60 * 1000 + Math.floor(Math.random() * 100000);
	t.beforeEach(() => {
		mock.timers.enable({
			apis: ["Date", "setTimeout"],
			now,
		});
	});
	t.afterEach(() => {
		mock.timers.reset();
	});

	await t.test("an empty array of timestamps is accepted", async () => {
		const { cache } = testCache();
		cache.withEvictTimestamps({ timestamps: [] });

		await cache.get(41);
		await cache.get(42);

		mock.timers.setTime(15 * 60 * 1000);
		assert.deepEqual(cache.getAll(), [41, 42]);
	});

	await t.test("if a timestamp is not hit yet, the values are kept", async () => {
		const { cache } = testCache();
		cache.withEvictTimestamps({
			timestamps: [
				{
					hours: 0,
					minutes: 20,
				},
			],
		});

		await cache.get(43);
		await cache.get(44);

		mock.timers.setTime(15 * 60 * 1000);
		assert.deepEqual(cache.getAll(), [43, 44]);
	});

	await t.test("if a timestamp is hit, all values are cleared", async () => {
		const { cache } = testCache();
		cache.withEvictTimestamps({
			timestamps: [
				{
					hours: 0,
					minutes: 20,
				},
			],
		});

		await cache.get(45);
		await cache.get(46);

		mock.timers.tick(30 * 60 * 1000);

		assert.equal(cache.getAll().length, 0);
	});

	await t.test("hit a few timestamps in a row", async () => {
		const { cache } = testCache();
		cache.withEvictTimestamps({
			timestamps: [
				{
					hours: 0,
					minutes: 20,
				},
				{
					hours: 0,
					minutes: 45,
				},
				{
					hours: 1,
					minutes: 25,
				},
			],
		});

		for (let i = 0; i < 3; ++i) {
			await cache.get(47);
			await cache.get(48);

			assert.equal(cache.getAll().length, 2);
			mock.timers.tick(30 * 60 * 1000);
			assert.equal(cache.getAll().length, 0);
		}
	});

	await t.test("disabling/enabling recreates the timer", async () => {
		const { cache } = testCache();
		cache.withEvictTimestamps({
			timestamps: [
				{
					hours: 0,
					minutes: 20,
				},
				{
					hours: 0,
					minutes: 40,
				},
			],
		});

		cache.disable();
		mock.timers.tick(30 * 60 * 1000);
		cache.enable();

		await cache.get(45);
		await cache.get(46);
		assert.equal(cache.getAll().length, 2);
		mock.timers.tick(30 * 60 * 1000);

		assert.equal(cache.getAll().length, 0);
	});
});
