import { readdir } from "node:fs/promises";
import path from "node:path";
import { SyntaxKind } from "ts-morph";
import type { Context } from "../context.js";
import { assignSignatureTagsToFunction, removeJsDocIfEmpty } from "../shared/jsdoc.js";
import { getTypescriptProgram } from "./init-ts-morph.js";

export async function fixGenerators(context: Context) {
	const ts = getTypescriptProgram(context);
	const genDirectory = path.join(context.outputDirectory, "gen");

	for (const file of await readdir(genDirectory)) {
		const sourceFile = ts.getSourceFileOrThrow(path.join(genDirectory, file));
		for (const fn of sourceFile.getFunctions()) {
			assignSignatureTagsToFunction(context, fn, {
				generator: "Generator",
				app: "Generator",
			});

			for (const doc of fn.getJsDocs()) {
				removeJsDocIfEmpty(doc);
			}

			if (file === "database.ts") {
				const tableCreateFn = fn.getVariableDeclaration("table");
				if (tableCreateFn) {
					const initializer = tableCreateFn.getInitializerIfKind(
						SyntaxKind.ArrowFunction,
					);
					initializer?.getParameter("table")?.setType("string");
				}

				const refCreateFn = fn.getVariableDeclaration("ref");
				if (refCreateFn) {
					const initializer = refCreateFn.getInitializerIfKind(SyntaxKind.ArrowFunction);
					initializer?.getParameter("name")?.setType("string");
				}
			}
		}

		await sourceFile.save();
	}
}
