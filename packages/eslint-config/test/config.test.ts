import { test, expect } from "vitest";
import { defineConfig } from "../src/index.js";

test("returns a config if no arguments are specified", async () => {
	expect(await defineConfig()).toEqual(expect.arrayContaining([]));
});

test("returns a config if TypeScript options are specified", async () => {
	expect(await defineConfig({ typescript: false })).toEqual(expect.arrayContaining([]));
	expect(await defineConfig({ typescript: true })).toEqual(expect.arrayContaining([]));
	expect(await defineConfig({ typescript: {} })).toEqual(expect.arrayContaining([]));
});

test("returns a config if globals are specified", async () => {
	expect(await defineConfig({ globals: ["node", "es5"] })).toEqual(
		expect.arrayContaining([]),
	);
});
