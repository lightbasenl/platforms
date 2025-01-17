/* eslint-disable @typescript-eslint/no-explicit-any */

import { constructError } from "./error.js";
import type { ErrorConstructor } from "./error.js";
import type { InferFunctionLikeParameters } from "./types.js";

/**
 * Accept any predicate function.
 */
interface InvariantPredicate {
	(v: any): boolean;
}

/**
 * Check that the predicate only accepts a single parameter.
 */
type ValidatePredicateType<P extends InvariantPredicate> =
	Parameters<P>["length"] extends 1 ? P
	:	() => {
			"~invalid predicate": "Predicate functions can only accept 1 (one) parameter.";
		};

/**
 * Convert 'any' to 'unknown' of the predicate function.
 *
 * Since any is a top-type, 'extends any' doesn't work. So we use a 'hack'. Param can only
 * intersect with 1 if Param is typed as 'any'. Which we can then check by checking if any
 * value extends that intersection.
 */
type ExtractPredicateParameterType<P extends InvariantPredicate> =
	P extends (v: infer Param) => boolean ?
		0 extends 1 & Param ?
			unknown
		:	Param
	:	never;

/**
 * Get the remainder of the tuple, based on the provided full tuple and start of the tuple.
 */
type InferRestTuple<Full extends Array<unknown>, Start extends Array<unknown>> =
	Start["length"] extends 0 ? Full
	: Start[0] extends Full[0] ?
		Full extends [infer _, ...infer FullRest] ?
			Start extends [infer _, ...infer StartRest] ?
				InferRestTuple<FullRest, StartRest>
			:	never
		:	never
	:	never;

/**
 * Create an invariant function with a customizable error to throw.
 * When the predicate function returns a falsy value, an error is created and thrown.
 *
 * If no options are passed for error customization an plain error is thrown, with an
 * optionally provided message via the return invariant function.
 *
 * @example
 * ```ts
 * const myInvariant = createInvariant({ predicate: isNil });
 * myInvariant(true); // throw Error("Invariant failed");
 * myInvariant(null, "Customized unused error message"); // Passes
 * ```
 *
 * A static error message can be provided as well:
 *
 * @example
 * ```ts
 * const myInvariant = createInvariant({ predicate: isNil, errorMessage: "My error", });
 * myInvariant(true); // throw Error("My error");
 * myInvariant(null); // Passes
 * ```
 *
 * Customizing the thrown error is possible via the 'errorConstructor'. It accepts any class,
 * function or static class method to construct the error.
 *
 * @example
 * ```ts
 * const myInvariant = createInvariant({ predicate: isNil, errorConstructor: Error });
 * myInvariant(true, "My Error", { cause: e }); // throw Error("My Error", { cause: e });
 *
 * class MyError extends Error {
 *   constructor(public status: number) {
 *      super();
 *   }
 * }
 *
 * const myErrorInvariant = createInvariant({ predicate: isNil, errorConstructor: MyError });
 * myErrorInvariant(true, 404); // throw MyError(404);
 * ```
 *
 * A function or static method can also be used to construct the error:
 *
 * @example
 * ```ts
 * function createError(isClientProblem: boolean) {
 *   return new Error(`Problem of: ${isClientProblem ? "client" : "server"}`);
 * }
 *
 * const myErrorInvariant = createInvariant({ predicate: isNil, errorConstructor: createError
 *   }); myErrorInvariant(5, true); // throw Error("Problem of client");
 * ```
 *
 * In all cases, some arguments can be provided statically:
 *
 * @example
 * ```ts
 * class MyError {
 *   constructor(public status: number, public message: string) {
 *     super();
 *   }
 * }
 *
 * const myErrorInvariant  = createInvariant({
 *   predicate: isNil,
 *   errorConstructor: MyError,
 *   errorArguments: [400],
 * });
 * myErrorInvariant(true, "Oops something went wrong"); // throw MyError(400, "Oops something
 *   went wrong");
 * ```
 */
export function createInvariant<const Predicate extends InvariantPredicate>(options: {
	predicate: ValidatePredicateType<Predicate>;
}): (v: ExtractPredicateParameterType<Predicate>, errorMessage?: string) => void;

export function createInvariant<const Predicate extends InvariantPredicate>(options: {
	predicate: ValidatePredicateType<Predicate>;
	errorMessage: string;
}): (v: ExtractPredicateParameterType<Predicate>) => void;

export function createInvariant<
	const Predicate extends InvariantPredicate,
	const ErrorLike extends ErrorConstructor,
>(options: {
	predicate: ValidatePredicateType<Predicate>;
	errorConstructor: ErrorLike;
}): (
	v: ExtractPredicateParameterType<Predicate>,
	...errorArguments: InferFunctionLikeParameters<ErrorLike>
) => void;

export function createInvariant<
	const Predicate extends InvariantPredicate,
	const ErrorLike extends ErrorConstructor,
	const ErrorArguments extends Partial<InferFunctionLikeParameters<ErrorLike>>,
>(options: {
	predicate: ValidatePredicateType<Predicate>;
	errorConstructor: ErrorLike;
	errorArguments: ErrorArguments;
}): (
	v: ExtractPredicateParameterType<Predicate>,
	...errorArguments: InferRestTuple<
		InferFunctionLikeParameters<ErrorLike>,
		ErrorArguments
	>
) => void;

export function createInvariant<const Predicate extends InvariantPredicate>(options: {
	predicate: ValidatePredicateType<Predicate>;
	errorConstructor?: ErrorConstructor;
	errorArguments?: Array<unknown>;
	errorMessage?: string;
}): (
	v: ExtractPredicateParameterType<Predicate>,
	...invariantArguments: Array<unknown>
) => void {
	const errorArguments = options.errorArguments ?? [];

	return (v: unknown, ...invariantArguments: Array<unknown>): void => {
		const predicateResult = options.predicate(v);
		if (predicateResult) {
			return;
		}

		if (options.errorConstructor) {
			throw constructError(options.errorConstructor, [
				...errorArguments,
				...invariantArguments,
			]);
		}

		let message = options.errorMessage;
		if (!message && typeof invariantArguments[0] === "string") {
			message = invariantArguments[0];
		}

		throw constructError(message ?? "Invariant failed.");
	};
}
