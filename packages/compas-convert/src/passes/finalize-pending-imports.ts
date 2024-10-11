import type { Context } from "../context.js";
import { addNamedImportIfNotExists } from "../shared/imports.js";
import { getTypescriptProgram } from "./init-ts-morph.js";

/**
 * Write out pending imports added via 'addPendingImport'.
 */
export async function finalizePendingImports(context: Context) {
	for (const [filename, pendingImports] of Object.entries(context.pendingImports)) {
		const sourceFile = getTypescriptProgram(context).getSourceFile(filename);
		if (!sourceFile) {
			continue;
		}

		for (const imp of pendingImports) {
			addNamedImportIfNotExists(sourceFile, imp.moduleName, imp.symbolName, imp.typeOnly);
		}

		await sourceFile.save();
	}
}
