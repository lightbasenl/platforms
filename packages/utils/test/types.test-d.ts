import { describe, expectTypeOf, it } from "vitest";
import type { OmitKeysThatExtend, PickKeysThatExtend, Prettify } from "../src/types.js";

describe("Prettify", () => {
	it("returns the same primitive", () => {
		expectTypeOf<Prettify<true>>().toExtend<boolean>();
		expectTypeOf<Prettify<"foo">>().toExtend<string>();
		expectTypeOf<Prettify<1>>().toExtend<number>();
		expectTypeOf<Prettify<null>>().toEqualTypeOf<null>();
	});

	it("returns the same object-like types", () => {
		expectTypeOf<
			Prettify<
				Pick<
					{
						foo: "bar";
					},
					"foo"
				>
			>
		>().toEqualTypeOf<{ foo: "bar" }>();
		expectTypeOf<
			Prettify<
				Pick<
					{
						foo: "bar";
					} & { bar: true },
					"foo"
				>
			>
		>().toEqualTypeOf<{ foo: "bar" }>();
	});
});

describe("PickKeysThatExtend", () => {
	it("returns an object like with keys that extend the provided type", () => {
		expectTypeOf<
			PickKeysThatExtend<
				{
					foo: string;
					bar: boolean;
				},
				string
			>
		>().toEqualTypeOf<{ foo: string }>();
	});
});

describe("OmitKeysThatExtend", () => {
	it("returns an object like with keys that do not extend the provided type", () => {
		expectTypeOf<
			OmitKeysThatExtend<
				{
					foo: string;
					bar: boolean;
				},
				string
			>
		>().toEqualTypeOf<{ bar: boolean }>();
	});

	it("omits possible undefined keys", () => {
		expectTypeOf<
			OmitKeysThatExtend<
				{
					foo: string;
					bar?: boolean;
				},
				undefined,
				"SelectExtendsValue"
			>
		>().toEqualTypeOf<{
			foo: string;
		}>();
	});

	it("omits ValueExtendsSelect", () => {
		expectTypeOf<
			OmitKeysThatExtend<
				{
					foo: 42;
					bar: number;
					quix: string;
				},
				number
			>
		>().toEqualTypeOf<{ quix: string }>();
	});

	it("omits SelectExtendsValue", () => {
		expectTypeOf<
			OmitKeysThatExtend<
				{
					foo: 42;
					bar: number;
				},
				number,
				"SelectExtendsValue"
			>
		>().toEqualTypeOf<{
			foo: 42;
		}>();
	});
});
