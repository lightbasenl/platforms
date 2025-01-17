import { describe, expect, it } from "vitest";
import { assertIsNil, assertNotNil } from "../src/assert.js";
import { isNilTestCases } from "./is.test.js";

describe("assertIsNil", () => {
	it.for([...isNilTestCases])(
		"runs through the stand isNil test cases - %s",
		({ input, expected }, { expect }) => {
			if (expected) {
				expect(() => {
					assertIsNil(input);
				}).not.toThrow();
			} else {
				expect(() => {
					assertIsNil(input);
				}).toThrow("Assertion failed.");
			}
		},
	);

	it("throws with the provided string", () => {
		expect(() => {
			assertIsNil("", "my error");
		}).toThrow("my error");
	});

	it("throws with the provided class", () => {
		class Z {}

		expect(() => {
			assertIsNil("", Z);
		}).toThrow(Z);
	});

	it("throws with the provided function and arguments", () => {
		const e = (arg: string) => new Error(arg);

		expect(() => {
			assertIsNil("", e, "foo");
		}).toThrowErrorMatchingInlineSnapshot(`[Error: foo]`);
	});
});

describe("assertNotNil", () => {
	it.for([...isNilTestCases])(
		"runs through the stand isNil test cases - %s",
		({ input, expected }, { expect }) => {
			if (expected) {
				expect(() => {
					assertNotNil(input);
				}).toThrow("Assertion failed.");
			} else {
				expect(() => {
					assertNotNil(input);
				}).not.toThrow();
			}
		},
	);

	it("throws with the provided string", () => {
		expect(() => {
			assertNotNil(null, "my error");
		}).toThrow("my error");
	});

	it("throws with the provided class", () => {
		class Z {}

		expect(() => {
			assertNotNil(undefined, Z);
		}).toThrow(Z);
	});

	it("throws with the provided function and arguments", () => {
		const e = (arg: string) => new Error(arg);

		expect(() => {
			assertNotNil(undefined, e, "foo");
		}).toThrowErrorMatchingInlineSnapshot(`[Error: foo]`);
	});
});
