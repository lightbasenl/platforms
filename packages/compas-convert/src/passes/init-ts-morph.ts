import { existsSync } from "node:fs";
import path from "node:path";
import { Project } from "ts-morph";
import type { Context } from "../context.js";

export const CONVERT_UTIL_PATH = "./src/compas-convert.ts";
export const CONVERT_UTIL = {
	any: "$ConvertAny",
	assertNotNil: "assertNotNil",
} as const;

/**
 * TS-morph is a library for manipulating via the TypeScript API's.
 *
 * Some other utils:
 * - https://www.npmjs.com/package/@typescript-eslint/type-utils
 * - https://github.com/JoshuaKGoldberg/ts-api-utils/tree/main
 */
export async function initTsMorph(context: Context) {
	context.ts = new Project({
		tsConfigFilePath: path.join(context.outputDirectory, "tsconfig.json"),
	});

	const qualifiedUtilPath = path.join(context.outputDirectory, CONVERT_UTIL_PATH);

	if (existsSync(qualifiedUtilPath)) {
		// Don't add the file again, if ts-morph is initialized again.
		return;
	}

	await context.ts
		.createSourceFile(
			qualifiedUtilPath,
			`
// File added by compas-convert

/**
 * While migrating, not every type can be resolved or inferred. In these cases, an explicit
 * $ConvertAny is added. This solves 2 problems:
 *
 * - Left-over issues from the migration are clearly visible.
 * - Only a single place needs the no-explicit-any rule.
 *
 * Manual usage of this type is strongly discouraged.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type $ConvertAny = any;

/**
 * Asserts that the provided value is not null or undefined.
 */
export function assertNotNil<T>(
	value: T,
	message?: string,
): asserts value is NonNullable<T> {
	if (value === null || value === undefined) {
		throw new Error(\`Invariant failed: $\{ message }\`);
	}
}
`,
		)
		.save();
}

export function getTypescriptProgram(context: Context) {
	if (!context.ts) {
		throw new Error("For some reason, ts-morph did not init.");
	}

	return context.ts;
}
