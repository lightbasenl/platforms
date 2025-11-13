import { constructError } from "./error.js";
import type { ErrorConstructor } from "./error.js";
import { isNil } from "./is.js";
import type { InferFunctionLikeParameters } from "./types.js";

/**
 * Asserts that the provided value is null|undefined.
 *
 * Customize the error by providing an error message. Further customization can be done by
 * providing a class or function and the appropriate arguments.
 */
export function assertIsNil(value: unknown): asserts value is null | undefined;

export function assertIsNil(
	value: unknown,
	errorMessage: string,
): asserts value is null | undefined;

export function assertIsNil<ErrorLike extends ErrorConstructor>(
	value: unknown,
	errorConstructor: ErrorLike,
	...errorArguments: InferFunctionLikeParameters<ErrorLike>
): asserts value is null | undefined;

export function assertIsNil(
	value: unknown,
	errorMessageOrConstructor?: string | ErrorConstructor,
	...args: Array<unknown>
): asserts value is null | undefined {
	if (!isNil(value)) {
		throw constructError(errorMessageOrConstructor ?? "Assertion failed.", args);
	}
}

/**
 * Asserts that the provided value is not null|undefined.
 *
 * Customize the error by providing an error message. Further customization can be done by
 * providing a class or function and the appropriate arguments.
 */
export function assertNotNil<T>(value: T): asserts value is NonNullable<T>;

export function assertNotNil<T>(
	value: T,
	errorMessage: string,
): asserts value is NonNullable<T>;

export function assertNotNil<T, ErrorLike extends ErrorConstructor>(
	value: T,
	errorConstructor: ErrorLike,
	...errorArguments: InferFunctionLikeParameters<ErrorLike>
): asserts value is NonNullable<T>;

export function assertNotNil<T>(
	value: T,
	errorMessageOrConstructor?: string | ErrorConstructor,
	...args: Array<unknown>
): asserts value is NonNullable<T> {
	if (isNil(value)) {
		throw constructError(errorMessageOrConstructor ?? "Assertion failed.", args);
	}
}

/**
 * Type-narrowing assert utility. Asserts that the provided value is truthy.
 *
 * Customize the error by providing an error message. Further customization can be done by
 * providing a class or function and the appropriate arguments.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function assert(condition: any): asserts condition;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function assert(condition: any, errorMessage: string): asserts condition;

export function assert<ErrorLike extends ErrorConstructor>(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	condition: any,
	errorConstructor: ErrorLike,
	...errorArguments: InferFunctionLikeParameters<ErrorLike>
): asserts condition;

export function assert(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	condition: any,
	errorMessageOrConstructor?: string | ErrorConstructor,
	...args: Array<unknown>
): asserts condition {
	if (!condition) {
		throw constructError(errorMessageOrConstructor ?? "Assertion failed.", args);
	}
}
