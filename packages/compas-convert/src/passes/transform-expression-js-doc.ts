import { Node, SyntaxKind } from "ts-morph";
import type { SourceFile } from "ts-morph";
import type { Context } from "../context.js";
import { convertStringToJSDoc, parseWildcardDocs } from "../shared/jsdoc.js";

export function transformExpressionJsDoc(context: Context, sourceFile: SourceFile) {
	// consola.debug({
	// 	file: sourceFile.getFilePath(),
	// });

	const blockRemovals: Array<[number, number]> = [];

	sourceFile.forEachDescendant((node, traversal) => {
		if (Node.isBlock(node)) {
			// Top-level comments are already converted.
			// We descend in to the block node inline below, so we don't have to track state.
			traversal.skip();

			node.forEachDescendant((node, _traversal) => {
				if (Node.isJSDocable(node)) {
					const statementDocBlocks = node.getJsDocs();

					for (const block of statementDocBlocks) {
						// Uses .getText(true); see https://github.com/dsherret/ts-morph/issues/721#issuecomment-538055482
						const parsedBlock = parseWildcardDocs(block.getText(true));
						if (parsedBlock?.type !== "type") {
							// Ignore unsupported blocks for now.
							// TODO: Figure out what cases we have here.
							continue;
						}

						if (parsedBlock.typeExpression) {
							// Try to inline the typeExpression.
							// TODO: figure out what to do instead of continue.
							const variableStatement = block.getParentIfKind(
								SyntaxKind.VariableStatement,
							);
							if (!variableStatement) {
								continue;
							}

							const [decl] = variableStatement.getDeclarations();
							if (!decl) {
								continue;
							}

							decl.setType(parsedBlock.typeExpression);
						}

						// consola.debug({
						// 	file: sourceFile.getFilePath(),
						// 	block: block.getText(true),
						// 	parsed: parsedBlock,
						// });

						if (parsedBlock.docs) {
							block.replaceWithText(convertStringToJSDoc(parsedBlock.docs));
						} else {
							blockRemovals.push([block.getPos(), block.getEnd()]);
						}
					}
				}

				return undefined;
			});

			return undefined;
		}

		return undefined;
	});

	// Cleanup unused doc blocks
	for (const [start, end] of blockRemovals.reverse()) {
		sourceFile.removeText(start, end);
	}
}
