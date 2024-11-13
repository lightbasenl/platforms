import { Node } from "ts-morph";
import type { SourceFile } from "ts-morph";
import type { Context } from "../context.js";

/**
 * Add 'assertNotNil' statements for possibly unchecked undefined values in test files.
 */
export function notNilChecksInTestFiles(context: Context, sourceFile: SourceFile) {
	if (!sourceFile.getFilePath().endsWith(".test.ts")) {
		// We only run this for test files. All other files are runtime behavior which has to be
		// double-checked.
		return;
	}

	let nextDiagnostic;
	let lastPosition = 0;

	while ((nextDiagnostic = getNextDiagnostic(sourceFile, lastPosition))) {
		lastPosition = nextDiagnostic.getStart()!;

		const expression = sourceFile.getDescendantAtPos(nextDiagnostic.getStart()!);
		if (!expression) {
			break;
		}

		const diagnosticText = nextDiagnostic.getMessageText();
		if (typeof diagnosticText !== "string") {
			continue;
		}

		const parentStatement =
			Node.isStatement(expression) ? expression : (
				expression.getParentWhile((_parent, node) => !Node.isStatement(node))
			);

		if (!parentStatement) {
			break;
		}

		const match = diagnosticText.slice(
			1,
			diagnosticText.indexOf("' is possibly 'undefined'"),
		);

		sourceFile.insertText(parentStatement.getStart(true), `assertNotNil(${match});\n\n`);

		// TODO: Handle 2532, 'Object is possibly 'undefined';
		// - We can get the assertNotNil expression via 'sourceFile
		// 				.getDescendantAtPos(it.getStart() ?? 0)
		// 				?.getParent()
		// 				?.getFullText()
		//  Or event via getStart() + getLength()
	}
}

function getNextDiagnostic(sourceFile: SourceFile, fromPosition: number) {
	const errorCodes = {
		expressionIsPossiblyUndefined: 18048,
	};

	// Is possibly undefined.
	return sourceFile
		.getPreEmitDiagnostics()
		.find(
			(it) =>
				(it.getStart() ?? 0) > fromPosition &&
				it.getCode() === errorCodes.expressionIsPossiblyUndefined,
		);
}
