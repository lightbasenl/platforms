import { describe, expect, it, vi } from "vitest";
import { createAsyncLocalStorage } from "../../src/node/index.js";

describe("createAsyncLocalStorage", () => {
	it("throws when .get is called without a value", () => {
		const localStorage = createAsyncLocalStorage("test");

		expect(() => {
			localStorage.get();
		}).toThrow("No value present in the test storage");
	});

	it("does not throw when .getOptional is called without a value", () => {
		const localStorage = createAsyncLocalStorage("test");

		expect(() => {
			expect(localStorage.getOptional()).toBeUndefined();
		}).not.toThrow();
	});

	it("returns the value the local storage was entered with", async () => {
		const localStorage = createAsyncLocalStorage<string>("test");

		const mockFn = vi.fn(() => {
			expect(localStorage.get()).toBe("foo");
		});

		await localStorage.run("foo", async () => {
			await new Promise<void>((r) => {
				r();
				mockFn();
			});

			mockFn();
		});

		expect(mockFn).toHaveBeenCalledTimes(2);
	});
});
