import { describe, expect, expectTypeOf, it } from "vitest";
import { isNil } from "../src/index.js";
import { createInvariant } from "../src/invariant.js";

describe("createInvariant", () => {
	it("returns a callable function", () => {
		const invariant = createInvariant({
			predicate: isNil,
		});

		expect(invariant).toBeTypeOf("function");
	});

	describe("invariant with customizable error message", () => {
		const invariant = createInvariant({
			predicate: isNil,
		});

		it("has the correct type", () => {
			expectTypeOf(invariant).toEqualTypeOf<(value: unknown, message?: string) => void>();
		});

		it("uses the type of the predicate when available", () => {
			type User = { id: string };

			expectTypeOf(createInvariant({ predicate: (_u: User) => false })).toEqualTypeOf<
				(value: User, message?: string) => void
			>();

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expectTypeOf(createInvariant({ predicate: (_u: any) => false })).toEqualTypeOf<
				(value: unknown, message?: string) => void
			>();
		});

		it("can be called", () => {
			expect(() => invariant(null)).not.toThrowError();
		});

		it("throws with a default message when the predicate fails", () => {
			expect(() => invariant(true)).toThrowErrorMatchingInlineSnapshot(
				`[Error: Invariant failed.]`,
			);
		});

		it("throws with the provided message when the predicate fails", () => {
			expect(() =>
				invariant(true, "Custom error message"),
			).toThrowErrorMatchingInlineSnapshot(`[Error: Custom error message]`);
		});
	});

	describe("invariant with static error message", () => {
		const invariant = createInvariant({
			predicate: isNil,
			errorMessage: "Static error",
		});

		it("has the correct type", () => {
			expectTypeOf(invariant).toEqualTypeOf<(value: unknown) => void>();
		});

		it("uses the type of the predicate when available", () => {
			type User = { id: string };

			expectTypeOf(
				createInvariant({
					predicate: (_u: User) => false,
					errorMessage: "Static message",
				}),
			).toEqualTypeOf<(value: User) => void>();

			expectTypeOf(
				createInvariant({
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					predicate: (_u: any) => false,
					errorMessage: "Static message",
				}),
			).toEqualTypeOf<(value: unknown) => void>();
		});

		it("can be called", () => {
			expect(() => invariant(null)).not.toThrowError();
		});

		it("throws with the static message when the predicate fails", () => {
			expect(() => invariant(true)).toThrowErrorMatchingInlineSnapshot(
				`[Error: Static error]`,
			);
		});
	});

	describe("invariant with parameter-less error constructor", () => {
		class MyError {
			public message = "Some message";
			constructor() {}
		}

		const invariant = createInvariant({
			predicate: isNil,
			errorConstructor: MyError,
		});

		it("has the correct type", () => {
			expectTypeOf(invariant).toEqualTypeOf<(value: unknown) => void>();
		});

		it("uses the type of the predicate when available", () => {
			type User = { id: string };

			expectTypeOf(
				createInvariant({
					predicate: (_u: User) => false,
					errorConstructor: MyError,
				}),
			).toEqualTypeOf<(value: User) => void>();

			expectTypeOf(
				createInvariant({
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					predicate: (_u: any) => false,
					errorConstructor: MyError,
				}),
			).toEqualTypeOf<(value: unknown) => void>();
		});

		it("can be called", () => {
			expect(() => invariant(null)).not.toThrowError();
		});

		it("throws with the custom errorConstructor", () => {
			expect(() => invariant(true)).toThrowErrorMatchingInlineSnapshot(`
				MyError {
				  "message": "Some message",
				}
			`);
		});
	});

	describe("invariant with parameter-less error constructor function", () => {
		class MyError {
			public message = "Some message";
			constructor() {}
		}

		const createError = () => new MyError();

		const invariant = createInvariant({
			predicate: isNil,
			errorConstructor: createError,
		});

		it("has the correct type", () => {
			expectTypeOf(invariant).toEqualTypeOf<(value: unknown) => void>();
		});

		it("uses the type of the predicate when available", () => {
			type User = { id: string };

			expectTypeOf(
				createInvariant({
					predicate: (_u: User) => false,
					errorConstructor: createError,
				}),
			).toEqualTypeOf<(value: User) => void>();

			expectTypeOf(
				createInvariant({
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					predicate: (_u: any) => false,
					errorConstructor: createError,
				}),
			).toEqualTypeOf<(value: unknown) => void>();
		});

		it("can be called", () => {
			expect(() => invariant(null)).not.toThrowError();
		});

		it("throws with the custom errorConstructor", () => {
			expect(() => invariant(true)).toThrowErrorMatchingInlineSnapshot(`
				MyError {
				  "message": "Some message",
				}
			`);
		});
	});

	describe("invariant with parameterized error constructor", () => {
		class MyError {
			public status: number;
			public key: string;

			constructor(status: number, key: string) {
				this.key = key;
				this.status = status;
			}
		}

		const invariant = createInvariant({
			predicate: isNil,
			errorConstructor: MyError,
		});

		it("has the correct type", () => {
			expectTypeOf(invariant).toEqualTypeOf<
				(value: unknown, status: number, key: string) => void
			>();
		});

		it("uses the type of the predicate when available", () => {
			type User = { id: string };

			expectTypeOf(
				createInvariant({
					predicate: (_u: User) => false,
					errorConstructor: MyError,
				}),
			).toEqualTypeOf<(value: User, status: number, key: string) => void>();

			expectTypeOf(
				createInvariant({
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					predicate: (_u: any) => false,
					errorConstructor: MyError,
				}),
			).toEqualTypeOf<(value: unknown, status: number, key: string) => void>();
		});

		it("can be called", () => {
			expect(() => invariant(null, 404, "oops")).not.toThrowError();
		});

		it("throws with the custom errorConstructor", () => {
			expect(() => invariant(true, 500, "oops")).toThrowErrorMatchingInlineSnapshot(`
				MyError {
				  "key": "oops",
				  "status": 500,
				}
			`);
		});
	});

	describe("invariant with partial applied parameterized error constructor", () => {
		class MyError {
			public status: number;
			public key: string;

			constructor(status: number, key: string) {
				this.key = key;
				this.status = status;
			}
		}

		const invariant = createInvariant({
			predicate: isNil,
			errorConstructor: MyError,
			errorArguments: [500],
		});

		it("has the correct type", () => {
			expectTypeOf(invariant).toEqualTypeOf<(value: unknown, key: string) => void>();
		});

		it("uses the type of the predicate when available", () => {
			type User = { id: string };

			expectTypeOf(
				createInvariant({
					predicate: (_u: User) => false,
					errorConstructor: MyError,
					errorArguments: [500],
				}),
			).toEqualTypeOf<(value: User, key: string) => void>();

			expectTypeOf(
				createInvariant({
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					predicate: (_u: any) => false,
					errorConstructor: MyError,
					errorArguments: [500],
				}),
			).toEqualTypeOf<(value: unknown, key: string) => void>();
		});

		it("can be called", () => {
			expect(() => invariant(null, "oops")).not.toThrowError();
		});

		it("throws with the custom errorConstructor", () => {
			expect(() => invariant(true, "bar")).toThrowErrorMatchingInlineSnapshot(`
				MyError {
				  "key": "bar",
				  "status": 500,
				}
			`);
		});
	});
});
