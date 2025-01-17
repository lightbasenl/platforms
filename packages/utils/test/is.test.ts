import { describe, it } from "vitest";
import { isNil, isRecord } from "../src/is.js";

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

describe("isNil", () => {
	it.for([...isNilTestCases])(
		"runs through the test cases '%s'",
		({ input, expected }, { expect }) => {
			expect(isNil(input)).toBe(expected);
		},
	);
});

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

describe("isRecord", () => {
	it.for([...isRecordTestCases])(
		"runs through the test cases '%s'",
		({ input, expected }, { expect }) => {
			expect(isRecord(input)).toBe(expected);
		},
	);
});
