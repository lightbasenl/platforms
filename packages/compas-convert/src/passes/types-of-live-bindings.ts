import { NodeFlags } from "ts-morph";
import type { SourceFile } from "ts-morph";
import type { Context } from "../context.js";
import { parseTypeDocs, typeExpressionToInlineType } from "../shared/jsdoc.js";
import { CONVERT_UTIL, getTypescriptProgram } from "./init-ts-morph.js";

/**
 * Rewrites all exported variables to include the type. Automatically add a ts-expect-error on
 * late-inits. This is a common pattern in our projects with ES Live bindings.
 */
export function fixTypesOfLiveBindings(context: Context, sourceFile: SourceFile) {
	getTypescriptProgram(context).forgetNodesCreatedInBlock(() => {
		const variableCountInFile = sourceFile.getVariableDeclarations().length;
		for (let i = 0; i < variableCountInFile; ++i) {
			// Always reparse the declarations, since we mutate text to update the comments.
			const variables = sourceFile.getVariableDeclarations();
			const variable = variables[i];
			if (!variable) {
				continue;
			}

			const [variableDoc] = variable
				.getVariableStatementOrThrow()
				.getJsDocs()
				.filter((it) => it.getTags().some((it) => it.getTagName() === "type"));

			if (!variableDoc) {
				return;
			}

			const parsedDoc = parseTypeDocs(variableDoc?.getFullText());

			const isExported = variable.getVariableStatementOrThrow().isExported();
			const isConst = variable.getFlags() & NodeFlags.Const;
			const name = variable.getName();
			const typeExpression = typeExpressionToInlineType(
				context,
				sourceFile,
				parsedDoc.typeExpression ?? CONVERT_UTIL.any,
			);
			const initializer = variable.getInitializer()?.getText() ?? "undefined";

			const needsTsIgnore =
				!parsedDoc.typeExpression?.includes("undefined") &&
				(!variable.getInitializer() ||
					variable.getInitializerOrThrow().getFullText().trim() === "undefined");

			let str = ``;

			if (parsedDoc.docs) {
				str += "/**\n";
				for (const line of parsedDoc.docs.split("\n")) {
					str += ` * ${line}\n`;
				}
				str += ` */\n`;
			}

			if (needsTsIgnore) {
				str += `// @ts-expect-error Late initialized via 'inject(Test)Services'.\n`;
			}
			if (isExported) {
				str += `export `;
			}
			if (isConst) {
				str += `const `;
			} else {
				str += `let `;
			}

			str += `${name}: ${typeExpression} = ${initializer};\n`;

			variable.getVariableStatementOrThrow().replaceWithText(str);
		}
	});
}
