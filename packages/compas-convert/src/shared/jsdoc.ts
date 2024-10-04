import consola from "consola";
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
import { CONVERT_UTIL } from "../passes/init-ts-morph.js";
import { addNamedImportIfNotExists } from "./import.js";

export function removeJsDocIfEmpty(doc: JSDoc) {
	if ((doc.getCommentText() ?? "").length === 0 && doc.getTags().length === 0) {
		return doc.remove();
	}
}

export function typeExpressionToInlineType(
	context: Context,
	typeExpression: JSDocTypeExpression | string,
	isOptional: boolean = false,
) {
	let type = typeof typeExpression === "string" ? typeExpression : "";

	if (typeof typeExpression !== "string") {
		type = typeExpression.getTypeNode().getText();

		if (type.length === 0) {
			return CONVERT_UTIL.any;
		}
	}

	if (isOptional && !type.includes("|undefined")) {
		type += "|undefined";
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
	let description = tags.docBlock?.getDescription() ?? "";

	const debugObject = {
		name: fn.getName(),
		docs: {
			docBlock: tags.docBlock?.getFullText(),
			description: [description],
			return: tags.returnTag?.getFullText(),
			params: Object.entries(tags.parameters ?? {}).map(([k, v]) => [
				k,
				v?.getFullText(),
			]),
			generics: tags.generics.map((it) => it.getFullText()),
		},
		params: [] as Array<Record<string, unknown>>,
		newDocBlock: {} as Record<string, unknown>,
	};

	const params = fn.getParameters();
	for (const param of params) {
		const tag = tags.parameters[param.getName()];
		const typeExpression = paramOverrides?.[param.getName()] ?? tag?.getTypeExpression();
		const stringType =
			typeExpression ?
				typeExpressionToInlineType(context, typeExpression, tag?.isBracketed() ?? false)
			:	"";

		debugObject.params.push({
			name: param.getName(),
			expression: stringType,
			type: param.getType().getText(),
		});

		if (!param.getTypeNode()) {
			try {
				if (!typeExpression) {
					param.setType(CONVERT_UTIL.any);
				} else {
					param.setType(stringType);
				}
			} catch (e) {
				consola.log("Adding param", debugObject);
				throw e;
			}
		}

		if (tag) {
			// Assign parameter docs to the function.
			if (tags.docBlock && tag.getCommentText()) {
				description += `\n- ${tag.getName()}: ${tag.getCommentText()}`;
				debugObject.docs.description.push(description);
			}
		}
	}

	const returnExpression = tags.returnTag?.getTypeExpression();
	debugObject.params.push({ name: "__return", expression: returnExpression });
	if (returnExpression) {
		fn.setReturnType(typeExpressionToInlineType(context, returnExpression));
	}

	if (tags.returnTag?.getCommentText() && tags.docBlock) {
		description += `\n - Returns: ${tags.returnTag?.getCommentText() ?? ""}`;
		debugObject.docs.description.push(description);
	}

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
	}

	const otherTags =
		tags.docBlock
			?.getTags()
			.filter((tag) => !["param", "returns", "template"].includes(tag.getTagName())) ??
		[];
	const newDocBlock = {
		description: description,
		tags: otherTags.map((it) => ({
			tagName: it.getTagName(),
			text: it.getText(),
		})),
	};

	debugObject.newDocBlock = newDocBlock;

	if (newDocBlock.description.length || newDocBlock.tags.length) {
		try {
			fn.addJsDoc(newDocBlock);
		} catch (e) {
			consola.log("Addition of docs", fn.getName(), debugObject);
			throw e;
		}
	}

	if (tags.docBlock) {
		try {
			tags.docBlock.remove();
		} catch (e) {
			consola.log("Removal of docs", fn.getName(), debugObject);
			throw e;
		}
	}
}

export function extractSignatureTagsForFunction(fn: FunctionDeclaration) {
	const parameters: Record<string, JSDocParameterTag | undefined> = {};
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
					parameters[param.getName()] = tag;

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
