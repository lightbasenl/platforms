import type { SourceFile } from "ts-morph";
import type { Context } from "../context.js";
import { assignSignatureTagsToFunction } from "../shared/jsdoc.js";

/**
 * Run through all global functions, moving JSDoc types to the function signature.
 */
export function fixTypesOfAllFunctions(context: Context, sourceFile: SourceFile) {
	for (const fn of sourceFile.getFunctions()) {
		assignSignatureTagsToFunction(context, fn);
	}
}
