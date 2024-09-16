import { SyntaxKind } from "ts-morph";
import type { SourceFile } from "ts-morph";
import type { Context } from "../context.js";
import { assignSignatureTagsToFunction, removeJsDocIfEmpty } from "../shared/jsdoc.js";

/**
 * Fixup generator-input files. The JSDoc on these functions might be outdated, and some inline
 * helper functions aren't typed.
 */
export function fixGenerators(context: Context, sourceFile: SourceFile) {
	const filePath = sourceFile.getFilePath();
	if (
		!filePath.includes("/gen/") &&
		!(filePath.includes("vendor") && filePath.includes("structure.ts"))
	) {
		return;
	}

	for (const fn of sourceFile.getFunctions()) {
		assignSignatureTagsToFunction(context, fn, {
			generator: "Generator",
			app: "Generator",
		});

		for (const doc of fn.getJsDocs()) {
			removeJsDocIfEmpty(doc);
		}

		if (filePath.endsWith("database.ts")) {
			const tableCreateFn = fn.getVariableDeclaration("table");
			if (tableCreateFn) {
				const initializer = tableCreateFn.getInitializerIfKind(SyntaxKind.ArrowFunction);
				initializer?.getParameter("table")?.setType("string");
			}

			const refCreateFn = fn.getVariableDeclaration("ref");
			if (refCreateFn) {
				const initializer = refCreateFn.getInitializerIfKind(SyntaxKind.ArrowFunction);
				initializer?.getParameter("name")?.setType("string");
			}
		}
	}
}
