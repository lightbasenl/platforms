import path from "node:path";
import { Project } from "ts-morph";
import type { Context } from "../context.js";

/**
 * TS-morph is a library for manipulating via the TypeScript API's.
 *
 * Some other utils:
 * - https://www.npmjs.com/package/@typescript-eslint/type-utils
 * - https://github.com/JoshuaKGoldberg/ts-api-utils/tree/main
 */
export function initTsMorph(context: Context) {
	context.ts = new Project({
		tsConfigFilePath: path.join(context.outputDirectory, "tsconfig.json"),
	});
}

export function getTypescriptProgram(context: Context) {
	if (!context.ts) {
		throw new Error("For some reason, ts-morph did not init.");
	}

	return context.ts;
}
