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

export type MaybePromise<Type> = Type | Promise<Type>;

export function isNil(value: unknown): value is null | undefined {
	return value === null || value === undefined;
}

export function isUnknownRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && !isNil(value);
}

export function objectWithKey<const K extends string>(
	value: unknown,
	key: K,
): value is Record<K, unknown> {
	return isUnknownRecord(value) && key in value;
}
