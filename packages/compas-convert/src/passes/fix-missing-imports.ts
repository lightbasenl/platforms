import type { SourceFile } from "ts-morph";
import type { Context } from "../context.js";

/**
 * Automatically try to add missing imports via the TS language server.
 */
export function fixMissingImports(context: Context, sourceFile: SourceFile) {
	sourceFile.fixMissingImports();
}
