import { Node } from "ts-morph";
import type { SourceFile } from "ts-morph";
import type { Context } from "../context.js";
import { parseWildcardDocs } from "../shared/jsdoc.js";

export function transformModuleJsDoc(context: Context, sourceFile: SourceFile) {
	// consola.debug({
	// 	file: sourceFile.getFilePath(),
	// });

	sourceFile.forEachDescendant((node, traversal) => {
		if (Node.isSyntaxList(node)) {
			return undefined;
		}

		// Always skip traversal, since we only handle module blocks here.
		traversal.skip();

		if (Node.isJSDocable(node)) {
			// Doc blocks are always added to another declaration, so the last one always belongs to
			// that declaration.
			const moduleDocBlocks = node.getJsDocs().slice(0, -1);

			const originalText = node.getFullText();
			let collectedText = originalText;

			for (const block of moduleDocBlocks) {
				const parsedBlock = parseWildcardDocs(block.getFullText());

				// consola.debug({
				// 	file: sourceFile.getFilePath(),
				// 	block: block.getFullText(),
				// 	parsed: parsedBlock,
				// });

				if (parsedBlock?.type === "typedef" || parsedBlock?.type === "unknown") {
					collectedText = collectedText.replace(
						block.getFullText(),
						parsedBlock.contents,
					);
				}
			}

			// Execute a single replacement for the whole variable or function declaration. This way we
			// can iterate once over the doc blocks and don't have to count for new statements added in
			// between.
			if (originalText !== collectedText) {
				node.replaceWithText(collectedText);
			}
		}

		return undefined;
	});
}
