import { Node } from "ts-morph";
import type { SourceFile } from "ts-morph";
import type { Context } from "../context.js";
import { typeExpressionToInlineType } from "../shared/jsdoc.js";
import { CONVERT_UTIL } from "./init-ts-morph.js";

/**
 * Rewrites all exported variables to include the type. Automatically add a ts-expect-error on
 * late-inits. This is a common pattern in our projects with ES Live bindings.
 */
export function fixTypesOfLiveBindings(context: Context, sourceFile: SourceFile) {
	const variableCountInFile = sourceFile.getVariableDeclarations().length;
	for (let i = 0; i < variableCountInFile; ++i) {
		// Always reparse the declarations, since we mutate text to update the comments.
		const variables = sourceFile.getVariableDeclarations();
		const variable = variables[i];
		if (!variable) {
			continue;
		}

		const docs = variable
			.getVariableStatementOrThrow()
			.getJsDocs()
			.filter((it) => it.getTags().some((it) => it.getTagName() === "type"));

		const variableDoc = docs[0];
		const [typeTag] =
			variableDoc?.getTags().filter((it) => Node.isJSDocTypeTag(it)) ?? [];

		if (variableDoc && typeTag) {
			const type = typeTag.getTypeExpression();

			if (!type) {
				variable.setType(CONVERT_UTIL.any);
				typeTag.remove();
			} else {
				// We have a complete case here, just rewrite the thing.
				const typeString = typeExpressionToInlineType(context, type);
				const needsTsIgnore =
					!typeString.includes("undefined") &&
					(!variable.getInitializer() ||
						variable.getInitializerOrThrow().getFullText().trim() === "undefined");
				const isExported = variable.getVariableStatementOrThrow().isExported();
				const description = variableDoc.getDescription() ?? "";
				const initializer = variable.getInitializer()?.getText() ?? "undefined";

				let str = ``;
				if (description.trim()) {
					str += `/**\n * ${description.trim().replaceAll("\n", "\n * ")}\n */\n`;
				}
				if (needsTsIgnore) {
					str += `// @ts-expect-error Late initialized via 'inject(Test)Services'.\n`;
				}
				if (isExported) {
					str += `export `;
				}
				str += `let ${variable.getName()}: ${typeString} = ${initializer};\n`;

				// TODO!: Note that replacing seems to break if a single line '/** @type {import("foo").bar} */' exists.
				variable.getVariableStatementOrThrow().replaceWithText(str);
			}
		}
	}
}
