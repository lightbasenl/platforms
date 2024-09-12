import type {
	FunctionDeclaration,
	JSDoc,
	JSDocParameterTag,
	JSDocReturnTag,
	JSDocTemplateTag,
	JSDocTypeExpression,
} from "ts-morph";
import { Node } from "ts-morph";
import type { Context } from "../context.js";
import { addNamedImportIfNotExists } from "../passes/add-common-imports.js";
import { CONVERT_UTIL } from "../passes/init-ts-morph.js";

export function removeJsDocIfEmpty(doc: JSDoc) {
	if ((doc.getCommentText() ?? "").length === 0 && doc.getTags().length === 0) {
		return doc.remove();
	}
}

export function typeExpressionToInlineType(
	context: Context,
	typeExpression: JSDocTypeExpression | string,
) {
	let type = typeof typeExpression === "string" ? typeExpression : "";

	if (typeof typeExpression !== "string") {
		type = typeExpression.getTypeNode().getText();

		if (type.length === 0) {
			return CONVERT_UTIL.any;
		}
	}

	if (/^[\w|\s<>,.]+$/gi.test(type)) {
		// number, boolean, FooBar, foo|bar, Foo<string>, Foo.Bar,
		return type;
	}

	const sourceFile =
		typeof typeExpression === "string" ? undefined : typeExpression.getSourceFile();

	// Cleanup multiline types. These include multiline ' * ' jsdoc prefixes.
	let resolvedType = type.replaceAll("* ", "");

	resolvedType = resolvedType.replaceAll(
		/(typeof )?import\(\s*"(.+)"\s*\)\s*\.(\w+)/gi,
		(group, ...match) => {
			// Cleanup import("foo").Bar into a type import.
			const hasTypeof = typeof match[0] === "string" && match[0].length > 0;
			const moduleName = match[1] as unknown;
			const symbolName = match[2] as unknown;

			if (
				hasTypeof ||
				typeof moduleName !== "string" ||
				moduleName.length === 0 ||
				typeof symbolName !== "string" ||
				symbolName.length === 0
			) {
				return group;
			}

			if (sourceFile) {
				if (moduleName.startsWith("../") || moduleName.startsWith("./")) {
					addNamedImportIfNotExists(sourceFile, moduleName, symbolName, !hasTypeof);
				} else {
					addNamedImportIfNotExists(sourceFile, moduleName, symbolName, !hasTypeof);
				}
			} else {
				// If the caller explicitly passes a string, we expect them to know what it is and add the
				// import themselves.
			}

			return hasTypeof ? `typeof ${symbolName}` : symbolName;
		},
	);

	return resolvedType;
}

/**
 * Extracts doc blocks from the function and tries to convert the types to inline types.
 */
export function assignSignatureTagsToFunction(
	context: Context,
	fn: FunctionDeclaration,
	paramOverrides?: Record<string, string>,
) {
	const tags = extractSignatureTagsForFunction(fn);

	const params = fn.getParameters();
	for (let paramIndex = 0; paramIndex < params.length; paramIndex++) {
		const tag = tags.parameters[paramIndex];
		const param = params[paramIndex]!;

		const typeExpression = paramOverrides?.[param.getName()] ?? tag?.getTypeExpression();

		if (!param.getTypeNode()) {
			if (!typeExpression) {
				param.setType(CONVERT_UTIL.any);
			} else {
				param.setType(typeExpressionToInlineType(context, typeExpression));
			}
		}

		if (tag) {
			// Assign parameter docs to the function.
			if (tags.docBlock && tag.getCommentText()) {
				tags.docBlock.setDescription(
					`${tags.docBlock.getDescription()}\n- ${tag.getName()}: ${tag.getCommentText()}`,
				);
			}

			tag.remove();
		}
	}

	const returnExpression = tags.returnTag?.getTypeExpression();
	if (returnExpression) {
		fn.setReturnType(typeExpressionToInlineType(context, returnExpression));
	}

	if (tags.returnTag?.getCommentText() && tags.docBlock) {
		tags.docBlock.setDescription(
			`${tags.docBlock.getDescription()}\n - Returns: ${tags.returnTag?.getCommentText() ?? ""}`,
		);
	}

	tags.returnTag?.remove();

	for (const template of tags.generics) {
		for (const param of template.getTypeParameters()) {
			fn.addTypeParameters(
				template.getTypeParameters().map((it) => ({
					name: it.getName(),
					constraint: param.getConstraint()?.getText(),
					default: param.getDefault()?.getText(),
				})),
			);
		}

		template.remove();
	}
}

export function extractSignatureTagsForFunction(fn: FunctionDeclaration) {
	const parameters: Array<JSDocParameterTag | undefined> = [];
	let returnTag: JSDocReturnTag | undefined = undefined;
	const generics: Array<JSDocTemplateTag> = [];
	let docBlock: JSDoc | undefined = undefined;

	const docs = fn.getJsDocs();

	// Leading doc blocks before a function are all assigned to the function. So we may traverse a
	// few of them. This shouldn't be any issue, since '@param' & '@returns' are only top-level in a
	// JSDoc block node when the doc block doesn't have tags like '@callback' and '@typedef'.
	for (const doc of docs) {
		const tags = doc.getTags();

		for (const tag of tags) {
			if (Node.isJSDocParameterTag(tag)) {
				const param = fn.getParameter(tag.getName());
				if (param) {
					parameters[param.getChildIndex()] = tag;

					if (!docBlock) {
						// Assume that the first doc block with a param match is the relevant function doc
						// block.
						docBlock = doc;
					}
				}
			} else if (Node.isJSDocReturnTag(tag)) {
				returnTag = tag;
			} else if (Node.isJSDocTemplateTag(tag)) {
				generics.push(tag);
			}
		}
	}

	return {
		docBlock,
		parameters,
		returnTag,
		generics,
	};
}
