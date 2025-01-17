import { AsyncLocalStorage } from "node:async_hooks";
import { assertNotNil } from "../assert.js";

/**
 * Wrapper around AsyncLocalStorage.
 *
 * The main difference is the explicit `get` and
 * `getOptional` functions that wrap `AsyncLocalStorage#getStore`. `get`, throws an error
 * when not in the async-context of a store.
 */
export function createAsyncLocalStorage<Type>(name: string) {
	const storage = new AsyncLocalStorage<Type>();

	return {
		/**
		 * Like {@link AsyncLocalStorage#getStore}, but adds a non-null assertion when not running
		 * in the async context.
		 */
		get() {
			const result = storage.getStore();
			assertNotNil(result, `No value present in the ${name} storage.`);
			return result;
		},

		/**
		 * Wrapper around {@link AsyncLocalStorage#getStore}
		 */
		getOptional() {
			return storage.getStore();
		},

		/**
		 * Wrapper around {@link AsyncLocalStorage#run}
		 */
		run<ReturnType>(value: Type, fn: () => ReturnType) {
			return storage.run<ReturnType>(value, fn);
		},

		/**
		 * Wrapper around {@link AsyncLocalStorage#exit}
		 */
		exit<ReturnType>(fn: () => ReturnType) {
			return storage.exit(fn);
		},
	};
}
