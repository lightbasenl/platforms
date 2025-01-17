/**
 * Let TypeScript resolve nested types, so type-information shows resolved types in Quick
 * Type popups and error messages.
 *
 * https://x.com/mattpocockuk/status/1622730173446557697
 */
export type Prettify<T> = { [K in keyof T]: T[K] } & {};

/**
 * Represents a value which may be wrapped in a Promise.
 */
export type MaybePromise<T> = T | Promise<T>;

/**
 * Extract the Promise type. If T is not a Promise, T is returned.
 */
export type ExtractPromise<T> = T extends Promise<infer N> ? N : T;

/**
 * Represents a value which may be alone or in an array.
 */
export type MaybeArray<T> = T | Array<T>;

/**
 * Extract the Array type. If T is not an Array, T is returned.
 */
export type ExtractArray<T> = T extends Array<infer N> ? N : T;

/**
 * Brand types, so an unvalidated primitive is not allowed.
 *
 * @example
 * ```
 * type Age = Brand<number, "age">;
 *
 * export function makeAge(value: number): Age {
 *   if (value >= 0 && value <= 120) {
 *     return value as Age;
 *   }
 *
 *   throw new Error("Invalid value for 'age'");
 * }
 *
 * function isOlderThan21(age: Age) {
 *   return age > 21;
 * }
 *
 * // => no type errors
 * isOlderThan21(makeAge(22));
 *
 * // => type error number is not assignable to Age
 * isOlderThan21(18);
 * ```
 */
export type Brand<Type, Brand extends string> = Type &
	Readonly<Record<`__brand_${Brand}`, never>>;

/**
 * Selector for {@link PickKeysThatExtend} and {@link OmitKeysThatExtend}.
 */
export type PickOmitVersions = "ValueExtendsSelect" | "SelectExtendsValue";

type RunPickOmitVersions<A, B, Selector extends PickOmitVersions> =
	Selector extends "ValueExtendsSelect" ?
		A extends B ?
			true
		:	false
	: B extends A ? true
	: false;

/**
 * Extract from T, the keys that point to a value that extend Select.
 *
 * If `SelectExtendsValue` is used as the Selector, the keys are extracted for which the Select
 * extends the Value.
 *
 * @example
 * ```
 * type Foo = {
 *   bar: boolean;
 *   baz: string;
 * };
 *
 * type BooleanFoo = PickKeysThatExtend<Foo, boolean>;
 * //? { bar: boolean }
 * ```
 */
export type PickKeysThatExtend<
	T,
	Select,
	Selector extends PickOmitVersions = "ValueExtendsSelect",
> = {
	[K in keyof T as RunPickOmitVersions<T[K], Select, Selector> extends true ? K
	:	never]: T[K];
};

/**
 * Omit from T, the keys that point a value that extend Select.
 *
 * If `SelectExtendsValue` is used as the Selector, the keys are omitted for which the Select
 * extends the Value.
 *
 *
 * @example
 * ```
 * type Foo = {
 *   bar: boolean;
 *   baz: string;
 * };
 *
 * type BooleanFoo = OmitKeysThatExtend<Foo, boolean>;
 * //? { baz: string }
 * ```
 */
export type OmitKeysThatExtend<
	T,
	Select,
	Selector extends PickOmitVersions = "ValueExtendsSelect",
> = {
	[K in keyof T as RunPickOmitVersions<T[K], Select, Selector> extends true ? never
	:	K]: T[K];
};

/**
 * Exclude from object Type, the keys that are assignable to object B.
 *
 * @example
 * ```ts
 * type A = { a: string, b: string };
 * type B = { a: string };
 *
 * type C = ExcludeRecords<A, B>;
 * //? { b: string }
 * ```
 */
export type ExcludeRecords<A, B> = UnionToIntersection<
	Exclude<
		{
			[K in keyof A]: Record<K, A[K]>;
		}[keyof A],
		{
			[K in keyof B]: Record<K, B[K]>;
		}[keyof B]
	>
>;

/**
 * Convert an union type to an intersection type.
 *
 * @example
 * ```
 * type Foo = { bar: string } | { baz: string };
 *
 * type Intersected = UnionToIntersection<Foo>;
 * //? { bar: string } & { baz: string }
 * ```
 */
// From https://stackoverflow.com/a/50375286 CC BY-SA 4.0
export type UnionToIntersection<U> =
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(U extends any ? (x: U) => void : never) extends (x: infer I) => void ? I : never;

/**
 * Extract constructor like or function parameters
 */
export type InferFunctionLikeParameters<T> =
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends abstract new (...args: infer P) => any ? P
	: // eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends (...args: infer P) => any ? P
	: never;
