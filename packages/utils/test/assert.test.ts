import { describe, expect, expectTypeOf, it } from "vitest";
import { assert, assertIsNil, assertNotNil } from "../src/assert.js";
import { isFalsyTestCases, isNilTestCases, isTruthyTestCases } from "./is.test.js";

describe("assert", () => {
	it.for([...isTruthyTestCases])(
		"runs through the truthy cases - %s",
		(input, { expect }) => {
			expect(() => assert(input)).not.toThrow();
		},
	);

	it.for([...isFalsyTestCases])(
		"runs through the falsey cases - %s",
		(input, { expect }) => {
			expect(() => assert(input)).toThrow();
		},
	);

	it("throws with the provided string", () => {
		expect(() => {
			assert(false, "my error");
		}).toThrow("my error");
	});

	it("throws with the provided class", () => {
		class Z {}

		expect(() => {
			assert(false, Z);
		}).toThrow(Z);
	});

	it("throws with the provided function and arguments", () => {
		const e = (arg: string) => new Error(arg);

		expect(() => {
			assert(false, e, "foo");
		}).toThrowErrorMatchingInlineSnapshot(`[Error: foo]`);
	});

	it("type narrows", () => {
		// Dynamic assignment but always truthy, so a string
		const value: string | number = Math.random() > 0 ? "foo" : 5;
		assert(typeof value === "string");

		expectTypeOf(value).toBeString();
	});
});

describe("assertIsNil", () => {
	it.for([...isNilTestCases])(
		"runs through the isNil test cases - %s",
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
		"runs through the isNil test cases - %s",
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
