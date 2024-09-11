import { Node } from "ts-morph";
import type {
	FunctionDeclaration,
	JSDocParameterTag,
	JSDocReturnTag,
	JSDocTemplateTag,
} from "ts-morph";
import type { JSDoc } from "ts-morph";
import type { Context } from "../context.js";
import { addConvertAnyImport } from "../passes/init-ts-morph.js";

export function removeJsDocIfEmpty(doc: JSDoc) {
	if ((doc.getCommentText() ?? "").length === 0 && doc.getTags().length === 0) {
		return doc.remove();
	}
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

		const typeExpression =
			paramOverrides?.[param.getName()] ??
			tag?.getTypeExpression()?.getTypeNode().getText();

		if (!param.getTypeNode()) {
			if (!tag || !typeExpression) {
				param.setType("$ConvertAny");
				addConvertAnyImport(context, param);
			} else {
				param.setType(typeExpression);
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
		fn.setReturnType(returnExpression.getTypeNode().getText());
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
