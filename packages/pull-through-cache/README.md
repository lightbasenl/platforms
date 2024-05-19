# Pull through cache

Async pull-through-cache with TTL and updated-value sampling support.

## When to use

- You want to reduce async tasks like database queries or external API calls.
- You don't need an external cache, like Redis, yet.
- You still have the memory budget to store things (permanently).

## Install

```shell
npm install --save-dev --exact @lightbase/pull-through-cache
```

## Usage

```ts
import { PullThroughCache } from "@lightbase/pull-through-cache";

type MyType = {
	id: string;
	value: number;
};

const cache = new PullThroughCache<MyType, MyType["id"]>()
	.withTTL({ ttl: 3000 })
	.withFetcher({
		async fetcher(cache, key) {
			const foo = await myTypeQueryById(key);

			return foo;
		},
	});

cache.get("1"); // => Promise<{ id: "1", value: 5 }>
```

## API

### `new PullThroughCache<KeyType, ValueType>(): PullThroughCache`

Create a new typed pull-through-cache. Note that the cache will also cache `undefined`
values from the fetcher. So either include `undefined` in the provided generic argument,
or make sure that the provided `fetcher` to
[`.withFetcher`](#withfetcher-fetcher-cache-pullthroughcache-key-keytype--promisevaluetype--pullthroughcache)
doesn't return `undefined`.

If no TTL, evict timestamps or sampler is set, the cache stores values indefinitely. In
those cases it might be better to use a `new Map()` instead.

### `.withTTL({ ttl: number }): PullThroughCache`

Expire cached entries once they are in the cache for `ttl` milliseconds. When
`cache.get()` is called on an expired entry, the provided `fetcher` is called.

### `.withUpdatedSampler({ stepValue?: number, randomValue?: number, sampler: (key: KeyType, value: ValueType) => Promise<"expire"|"keep"> }): PullThroughCache`

Sample `cache.get()` calls to check if the value is outdated. This method supports either
step-based sampling or random-based sampling, based on the uniform distribution of
`Math.random()`.

If the `stepValue` is provided, each call to `cache.get()` increments an cache instance
based counter. If `$counter % stepValue === 0`, the sampler is called.

If `randomValue` is provided, each call to `cache.get()` executes a `Math.random()` call
to retrieve a `$random`. When `$random < $randomValue`, the sampler is called.

The sampler is called with both the cache key and cached value. When the sampler returns
`expire`, the `fetcher` will be called to retrieve the new value.

### `.withEvictTimestamps({ timestamps: { hours: number, minutes }[] }): PullThroughCache`

Evict all cached entries on the provided hours and minutes combinations. The cache
automatically sorts the provided array and takes the first suitable entry to wait for. It
automatically wraps around to the next day.

Note that it uses a single background timer to execute this functionality. {@link
NodeJS.Timer.unref} is called on the timer, so it doesn't hold up the process.

### `.withFetcher({ fetcher: (cache: PullThroughCache, key: KeyType) => Promise<ValueType> }): PullThroughCache`

Set the fetcher to be called when an unknown or expired key is used in `cache.get()`.

If `cache.get()` is called, before the `fetcher` is set, the cache will throw an error.

### `.get(key: KeyType): Promise<ValueType>`

Retrieve a value from the cache. May call both the `sampler` from `.withUpdatedSampler` as
well as the `fetcher` from `.withFetcher`.

### `.getAll(): ValueType[]`

Retrieve all non-expired values in the cache. This acts on expired TTL values if `withTTL`
is used. However, it ignores the sampler.

### `.setMany(entries: [key: KeyType, value: ValueType][]): void`

Set many entries in the cache. This can be used if you know that certain related keys
should be cached as well in a `fetcher` call. Note that if you use this call in the
`fetcher`, you still need to return the individual value. If you use `cache.get()` in the
fetcher to retrieve this value, you might get an infinite recursive loop if the `setMany`
call does not include your key.

```ts
import { PullThroughCache } from "@lightbase/pull-through-cache";

const cache = new PullThroughCache<FeatureFlags, FeatureFlagIdentifiers>()
	.withTTL({ ttl: 5 * 60 * 1000 })
	.withFetcher({
		async fetcher(cache, key) {
			const allFlags = await retrieveAllFeatureFlagsSomehow();
			cache.setMany(flags.map((it) => [it.identifier, it]));

			// Make sure that we have the asked for key as well
			const thisFlag = allFlags.find((it) => it.identifier === key);
			assertNotNil(thisFlag);

			return thisFlag;
		},
	});
```

### `.isEnabled(): boolean`

Retrieve if the cache is enabled or disabled. By default, the cache is enabled. A disabled
cache will use the `fetcher` on each invocation of `cache.get()`. Other calls are
practically no-ops:

- `cache.getAll()` will always return an empty list
- `cache.setMany()` will ignore the provided entries.

### `.enable(): void`

Enable the cache. If the cache is already enabled, this call is a no-op.

### `.disable(): void`

Disable the cache. On invocation, the cache will evict all its entries. See
[`.isEnabled()](#isenabled-boolean) for behavior of the other methods.

## License

[MIT](./LICENSE)
