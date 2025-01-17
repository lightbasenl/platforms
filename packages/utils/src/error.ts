/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Accept any function that constructs a throwable. i.e an Error constructor or a `createError`
 * function.
 */
export type ErrorConstructor =
	| (abstract new (...args: any) => any)
	| ((...args: any) => any);

/**
 * Construct an error based on the provided string, class or function.
 */
export function constructError(
	constructorFunctionOrMessage: string | ErrorConstructor,
	args: Array<unknown> = [],
): unknown {
	if (typeof constructorFunctionOrMessage === "string") {
		return new Error(constructorFunctionOrMessage);
	}

	const isClass = Function.prototype.toString
		.call(constructorFunctionOrMessage)
		.startsWith("class");

	if (isClass) {
		// @ts-expect-error value is a constructor. Args should be typed at the API boundary.
		return new constructorFunctionOrMessage(...args);
	}

	// @ts-expect-error value is a function. Args should be typed at the API boundary.
	return constructorFunctionOrMessage(...args);
}
