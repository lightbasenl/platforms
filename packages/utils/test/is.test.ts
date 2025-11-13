import { describe, expectTypeOf, it } from "vitest";
import { isNil, isRecord, isRecordWith } from "../src/is.js";

export const isTruthyTestCases = [true, 1, "foo", {}, [], () => {}];
export const isFalsyTestCases = [false, 0, "", null, undefined];

export const isNilTestCases = [
	{ input: null, expected: true },
	{ input: undefined, expected: true },
	{ input: true, expected: false },
	{ input: false, expected: false },
	{ input: "", expected: false },
	{ input: "asdfa", expected: false },
	{ input: 0, expected: false },
	{ input: 5, expected: false },
	{ input: -5, expected: false },
	{ input: [], expected: false },
	{ input: [1, 2, 3], expected: false },
	{ input: Array(4), expected: false },
	{ input: {}, expected: false },
	{ input: { foo: "bar" }, expected: false },
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	{ input: Object.create(null), expected: false },
	{ input: class {}, expected: false },
	{ input: new (class {})(), expected: false },
	{ input: () => {}, expected: false },
];

export const isRecordTestCases = [
	{ input: null, expected: false },
	{ input: undefined, expected: false },
	{ input: true, expected: false },
	{ input: false, expected: false },
	{ input: "", expected: false },
	{ input: "asdfa", expected: false },
	{ input: 0, expected: false },
	{ input: 5, expected: false },
	{ input: -5, expected: false },
	{ input: [], expected: false },
	{ input: [1, 2, 3], expected: false },
	{ input: Array(4), expected: false },
	{ input: {}, expected: true },
	{ input: { foo: "bar" }, expected: true },
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	{ input: Object.create(null), expected: true },
	{ input: class {}, expected: false },
	{ input: new (class {})(), expected: true },
	{ input: () => {}, expected: false },
];

describe("isNil", () => {
	it.for([...isNilTestCases])(
		"runs through the test cases '%s'",
		({ input, expected }, { expect }) => {
			expect(isNil(input)).toBe(expected);
		},
	);
});

describe("isRecord", () => {
	it.for([...isRecordTestCases])(
		"runs through the test cases '%s'",
		({ input, expected }, { expect }) => {
			expect(isRecord(input)).toBe(expected);
		},
	);

	it("type-narrows the result", ({ expect }) => {
		const input = { foo: "bar" } as unknown;
		expect.assertions(1);

		if (isRecord(input)) {
			expectTypeOf(input).toEqualTypeOf<Record<string, unknown>>();
			expect(input.foo).toBe("bar");
		}
	});
});

describe("isRecordWith", () => {
	it.for([...isRecordTestCases])(
		"runs through the test cases '%s'",
		({ input, expected }, { expect }) => {
			expect(isRecordWith(input, [])).toBe(expected);
		},
	);

	it("only returns true if all keys are in the record", ({ expect }) => {
		const input = { foo: undefined };

		expect(isRecordWith(input, ["foo", "bar"])).toBe(false);
	});

	it("type-narrows the result", ({ expect }) => {
		const input = { foo: "bar" } as unknown;
		expect.assertions(1);

		if (isRecordWith(input, ["foo"])) {
			expectTypeOf(input).toEqualTypeOf<Record<"foo", unknown>>();
			expect(input.foo).toBe("bar");
		}
	});
});
