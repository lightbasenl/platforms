import assert from "node:assert/strict";
import { beforeEach, expect, suite, test, vi } from "vitest";
import type { CacheEventCallback } from "../src/cache.js";
import { PullThroughCache } from "../src/index.js";
import type { CacheSamplerFn } from "../src/index.js";
import type { CacheFetcherFn } from "../src/index.js";

function testCache(fetcher?: CacheFetcherFn<number, number | undefined>) {
	fetcher ??= (_cache, key) => key;

	const mockedFetcher = vi.fn(fetcher);
	const mockedEventCallback = vi.fn((_event: Parameters<CacheEventCallback>[0]) => {});

	const cache = new PullThroughCache<number, number | undefined>()
		.withFetcher({
			fetcher: mockedFetcher as typeof fetcher,
		})
		.withEventCallback({
			callback: mockedEventCallback,
		});

	return {
		cache,
		fetcher: mockedFetcher,
		eventCallback: mockedEventCallback,
	};
}

function testSampledCache({
	stepValue,
	sampler,
}: {
	stepValue: number;
	sampler: CacheSamplerFn<number, number | undefined>;
}) {
	const { cache, fetcher, eventCallback } = testCache();

	const mockedSampler = vi.fn(sampler);

	cache.withUpdatedSampler({
		sampler: mockedSampler as CacheSamplerFn<number, number | undefined>,
		stepValue,
	});

	return {
		cache,
		fetcher,
		eventCallback,
		sampler: mockedSampler,
	};
}

test("can be constructed", () => {
	const ptc = new PullThroughCache();
	assert.ok(ptc);
});

suite("withUpdatedSampler input validation", () => {
	test("throw if both stepValue and randomValue are not provided", () => {
		expect(() => {
			new PullThroughCache().withUpdatedSampler({
				sampler: () => "keep",
			});
		}).toThrow(/must be provided/);
	});

	test("throw if both stepValue and randomValue are provided", () => {
		expect(() => {
			new PullThroughCache().withUpdatedSampler({
				sampler: () => "keep",
				randomValue: 1,
				stepValue: 1,
			});
		}).toThrow(/should be provided/);
	});

	test("throw if step value is not an integer", () => {
		expect(() => {
			new PullThroughCache().withUpdatedSampler({
				sampler: () => "keep",
				stepValue: 1.1,
			});
		}).toThrow(/'stepValue' must be a positive integer/);
	});

	test("throw if step value 0", () => {
		expect(() => {
			new PullThroughCache().withUpdatedSampler({
				sampler: () => "keep",
				stepValue: 0,
			});
		}).toThrow(/'stepValue' must be a positive integer/);
	});

	test("throw if random value is negative", () => {
		expect(() => {
			new PullThroughCache().withUpdatedSampler({
				sampler: () => "keep",
				randomValue: -1,
			});
		}).toThrow(/'randomValue' must be between/);
	});

	test("throw if random value is bigger than 1", () => {
		expect(() => {
			new PullThroughCache().withUpdatedSampler({
				sampler: () => "keep",
				randomValue: 1.5,
			});
		}).toThrow(/'randomValue' must be between/);
	});
});

suite("baseline", () => {
	test("throws if .get() is called without setting a fetcher", async () => {
		expect.assertions(1);

		const ptc = new PullThroughCache();

		await expect(async () => {
			await ptc.get("some key");
		}).rejects.toThrow(/Make sure to call '.withFetcher\(\)'/);
	});

	test("call the fetcher on a new key", async () => {
		const { cache, fetcher, eventCallback } = testCache();

		expect(await cache.get(5)).toBe(5);

		expect(fetcher.mock.calls.length).toBe(1);
		expect(fetcher.mock.calls[0]?.[0]).toBe(cache);
		expect(fetcher.mock.calls[0]?.[1]).toBe(5);

		expect(eventCallback.mock.calls.length).toBe(1);
		expect(eventCallback.mock.calls[0]?.[0]).toBe("miss");
	});

	test("call the fetcher once for a specific key", async () => {
		const { cache, fetcher, eventCallback } = testCache();

		expect(await cache.get(5)).toBe(5);
		expect(await cache.get(5)).toBe(5);
		expect(await cache.get(5)).toBe(5);

		expect(fetcher.mock.calls.length).toBe(1);

		expect(eventCallback.mock.calls.length).toBe(3);
		expect(eventCallback.mock.calls[0]?.[0]).toBe("miss");
		expect(eventCallback.mock.calls[1]?.[0]).toBe("hit");
		expect(eventCallback.mock.calls[2]?.[0]).toBe("hit");
	});

	test("call the fetcher each time if the cache is disabled", async () => {
		const { cache, fetcher, eventCallback } = testCache();

		cache.disable();

		expect(await cache.get(5)).toBe(5);
		expect(await cache.get(5)).toBe(5);
		expect(await cache.get(5)).toBe(5);
		expect(cache.getAll().length).toBe(0);

		expect(fetcher.mock.calls.length).toBe(3);

		expect(eventCallback.mock.calls.length).toBe(3);
		expect(eventCallback.mock.calls[0]?.[0]).toBe("miss");
		expect(eventCallback.mock.calls[1]?.[0]).toBe("miss");
		expect(eventCallback.mock.calls[2]?.[0]).toBe("miss");
	});

	test("call the fetcher once per different key", async () => {
		const { cache, fetcher, eventCallback } = testCache();

		expect(await cache.get(5)).toBe(5);
		expect(await cache.get(6)).toBe(6);
		expect(await cache.get(6)).toBe(6);

		expect(fetcher.mock.calls.length).toBe(2);

		expect(fetcher.mock.calls[0]?.[0]).toBe(cache);
		expect(fetcher.mock.calls[0]?.[1]).toBe(5);
		expect(fetcher.mock.calls[1]?.[0]).toBe(cache);
		expect(fetcher.mock.calls[1]?.[1]).toBe(6);

		expect(eventCallback.mock.calls.length).toBe(3);
		expect(eventCallback.mock.calls[0]?.[0]).toBe("miss");
		expect(eventCallback.mock.calls[1]?.[0]).toBe("miss");
		expect(eventCallback.mock.calls[2]?.[0]).toBe("hit");
	});

	test("getAll returns the cached values", async () => {
		const { cache } = testCache();

		expect(await cache.get(5)).toBe(5);
		assert.deepEqual(cache.getAll(), [5]);
		expect(await cache.get(6)).toBe(6);
		assert.deepEqual(cache.getAll(), [5, 6]);
		expect(await cache.get(6)).toBe(6);
		assert.deepEqual(cache.getAll(), [5, 6]);
	});

	test("setMany in the fetcher is directly available", async () => {
		const { cache } = testCache((_cache, key) => {
			_cache.setMany(Array.from({ length: 10 }).map((_, idx) => [idx, idx]));
			return cache.get(key);
		});

		expect(await cache.get(1)).toBe(1);
		assert.deepEqual(cache.getAll(), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
	});

	test("setMany on a disabled cache doesn't store an entry", async () => {
		const { cache } = testCache((_cache, key) => {
			_cache.setMany(Array.from({ length: 10 }).map((_, idx) => [idx, idx]));

			if (!_cache.isEnabled()) {
				return undefined;
			}

			return cache.get(key);
		});

		cache.disable();

		expect(cache.isEnabled()).toBe(false);
		expect(await cache.get(1)).toBe(undefined);
		expect(cache.getAll().length).toBe(0);
	});

	test("disabling the cache clears all entries", async () => {
		const { cache } = testCache((_cache, key) => {
			_cache.setMany(Array.from({ length: 10 }).map((_, idx) => [idx, idx]));
			return cache.get(key);
		});

		expect(await cache.get(1)).toBe(1);
		assert.deepEqual(cache.getAll(), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
		cache.disable();
		expect(cache.getAll().length).toBe(0);
	});

	test("calling 'clearAll' clears all entries", async () => {
		const { cache } = testCache((_cache, key) => {
			_cache.setMany(Array.from({ length: 10 }).map((_, idx) => [idx, idx]));
			return cache.get(key);
		});

		expect(await cache.get(1)).toBe(1);
		assert.deepEqual(cache.getAll(), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
		cache.clearAll();
		expect(cache.getAll().length).toBe(0);
	});
});

suite("ttl", () => {
	// Random start date between 0 and 100 seconds
	const now = Math.floor(Math.random() * 100000);

	beforeEach(() => {
		vi.useFakeTimers({
			now,
		});

		return () => {
			vi.useRealTimers();
		};
	});

	test("without timer advancements, value is cached indefinitely", async () => {
		const { cache, fetcher } = testCache();
		cache.withTTL({
			ttl: 5,
		});

		expect(await cache.get(10)).toBe(10);
		expect(await cache.get(10)).toBe(10);
		expect(await cache.get(10)).toBe(10);
		expect(await cache.get(10)).toBe(10);
		expect(await cache.get(10)).toBe(10);
		expect(await cache.get(10)).toBe(10);
		expect(fetcher.mock.calls.length).toBe(1);
	});

	test("advancing the timer without hitting the TTL does not call the fetcher again", async () => {
		const { cache, fetcher } = testCache();
		cache.withTTL({
			ttl: 5,
		});

		expect(await cache.get(11)).toBe(11);
		vi.advanceTimersByTime(3);
		expect(await cache.get(11)).toBe(11);
		expect(fetcher.mock.calls.length).toBe(1);
	});

	test("advancing the timer more than the TTL results another fetcher call.", async () => {
		const { cache, fetcher } = testCache();
		cache.withTTL({
			ttl: 5,
		});

		expect(await cache.get(12)).toBe(12);
		vi.advanceTimersByTime(10);
		expect(await cache.get(12)).toBe(12);
		expect(fetcher.mock.calls.length).toBe(2);
	});

	test("getAll does not return TTL expired values", async () => {
		const { cache } = testCache();
		cache.withTTL({
			ttl: 4,
		});

		for (let i = 0; i < 5; ++i) {
			await cache.get(i);
			vi.advanceTimersByTime(1);
		}

		assert.deepEqual(cache.getAll(), [1, 2, 3, 4]);
	});

	test("getAll does not return TTL expired values - 2 ticks", async () => {
		const { cache } = testCache();
		cache.withTTL({
			ttl: 4,
		});

		for (let i = 0; i < 5; ++i) {
			await cache.get(i);
			vi.advanceTimersByTime(2);
		}

		assert.deepEqual(cache.getAll(), [3, 4]);
	});

	test("values set via setMany also respect the TTL", async () => {
		const { cache } = testCache((_cache, key) => {
			_cache.setMany(Array.from({ length: 10 }).map((_, idx) => [idx, idx]));
			return cache.get(key);
		});
		cache.withTTL({
			ttl: 5,
		});

		await cache.get(1);
		expect(cache.getAll().length).toBe(10);
		vi.advanceTimersByTime(10);
		expect(cache.getAll().length).toBe(0);
	});
});

suite("updatedSampler", () => {
	// Note that we skip 'randomValue' sample tests here. Have to figure out a mocking solution
	// or other way to retrieve a random value for that first.

	test("sampler result 'keep' does not result in an extra call to the fetcher", async () => {
		const { cache, fetcher, sampler, eventCallback } = testSampledCache({
			stepValue: 1,
			sampler: () => "keep",
		});

		await cache.get(21);
		expect(fetcher.mock.calls.length).toBe(1);
		expect(sampler.mock.calls.length).toBe(0);

		await cache.get(21);
		expect(fetcher.mock.calls.length).toBe(1);
		expect(sampler.mock.calls.length).toBe(1);

		expect(eventCallback.mock.calls.length).toBe(3);
		expect(eventCallback.mock.calls[0]?.[0]).toBe("miss");
		expect(eventCallback.mock.calls[1]?.[0]).toBe("sample-keep");
		expect(eventCallback.mock.calls[2]?.[0]).toBe("hit");
	});
	test("sampler result 'expire' results in another call to the fetcher", async () => {
		const { cache, fetcher, sampler, eventCallback } = testSampledCache({
			stepValue: 1,
			sampler: () => "expire",
		});

		await cache.get(22);
		expect(fetcher.mock.calls.length).toBe(1);
		expect(sampler.mock.calls.length).toBe(0);

		await cache.get(22);
		expect(fetcher.mock.calls.length).toBe(2);
		expect(sampler.mock.calls.length).toBe(1);

		expect(eventCallback.mock.calls.length).toBe(3);
		expect(eventCallback.mock.calls[0]?.[0]).toBe("miss");
		expect(eventCallback.mock.calls[1]?.[0]).toBe("sample-expire");
		expect(eventCallback.mock.calls[2]?.[0]).toBe("miss");
	});

	test("the fetcher is called every 'stepValue' calls", async () => {
		const { cache, fetcher, sampler } = testSampledCache({
			stepValue: 2,
			sampler: () => "expire",
		});

		for (let i = 0; i < 10; ++i) {
			await cache.get(23);
		}

		// Note that if no value is not present, the sampler is not called.
		expect(sampler.mock.calls.length).toBe(4);
		expect(fetcher.mock.calls.length).toBe(5);
	});
});

suite("evict timestamps", () => {
	// Random start date between 0 and 100 seconds a day in advance.
	const now = 24 * 60 * 60 * 1000 + Math.floor(Math.random() * 100000);

	beforeEach(() => {
		vi.useFakeTimers({
			now,
		});

		return () => {
			vi.useRealTimers();
		};
	});

	test("an empty array of timestamps is accepted", async () => {
		const { cache } = testCache();
		cache.withEvictTimestamps({ timestamps: [] });

		await cache.get(41);
		await cache.get(42);

		vi.setSystemTime(15 * 60 * 1000);
		assert.deepEqual(cache.getAll(), [41, 42]);
	});

	test("if a timestamp is not hit yet, the values are kept", async () => {
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

		vi.setSystemTime(15 * 60 * 1000);

		assert.deepEqual(cache.getAll(), [43, 44]);
	});

	test("if a timestamp is hit, all values are cleared", async () => {
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

		vi.advanceTimersByTime(30 * 60 * 1000);

		expect(cache.getAll().length).toBe(0);
	});

	test("hit a few timestamps in a row", async () => {
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

			expect(cache.getAll().length).toBe(2);
			await vi.advanceTimersByTimeAsync(35 * 60 * 1000);
			expect(cache.getAll().length).toBe(0);
		}
	});

	test("disabling/enabling recreates the timer", async () => {
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
		vi.advanceTimersByTime(30 * 60 * 1000);
		cache.enable();

		await cache.get(45);
		await cache.get(46);
		expect(cache.getAll().length).toBe(2);
		vi.advanceTimersByTime(30 * 60 * 1000);

		expect(cache.getAll().length).toBe(0);
	});
});
