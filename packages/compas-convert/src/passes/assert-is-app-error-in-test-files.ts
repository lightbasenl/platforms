import type { SourceFile } from "ts-morph";
import { Node, ts } from "ts-morph";
import type { Context } from "../context.js";
import SyntaxKind = ts.SyntaxKind;

/**
 * Add 'assertIsAppError' statements for type checking caught exception values in test files.
 */
export function isAppErrorInTestFiles(context: Context, sourceFile: SourceFile) {
	if (!sourceFile.getFilePath().endsWith(".test.ts")) {
		// We only run this for test files. All other files are runtime behavior which has to be
		// double-checked.
		return;
	}

	let nextDiagnostic;
	// Keep track of the last position, so we only move forwards in the file, and don't get stuck on
	// an expression we can't fix.
	let lastPosition = 0;

	while (
		(nextDiagnostic = getNextObjectOfTypeUnknownDiagnostic(sourceFile, lastPosition))
	) {
		// Move past the full error
		lastPosition = nextDiagnostic.getStart()! + nextDiagnostic.getLength()! + 1;

		// For some reason, we can't find the position of the diagnostic.
		const expression = sourceFile.getDescendantAtPos(nextDiagnostic.getStart()!);
		if (!expression) {
			continue;
		}

		// Find the wrapping statement. These errors are always inside an expression part of some
		// statement.
		const parentStatement =
			Node.isStatement(expression) ? expression : (
				expression.getParentWhile((_parent, node) => !Node.isStatement(node))
			);

		if (!parentStatement) {
			continue;
		}

		if (!isInCatchClause(parentStatement)) {
			continue;
		}

		// The diagnostic text is not always helpful, so retrieve the expression from the file contents.
		// -  "'e' is of type unknown'"
		const expressionMatch = sourceFile
			.getFullText()
			.slice(
				nextDiagnostic.getStart(),
				nextDiagnostic.getStart()! + nextDiagnostic.getLength()!,
			);

		try {
			const keyOrInfoRegex = new RegExp(`${expressionMatch}\\.(?:key|info|status)\\b`);

			if (
				parentStatement.getText().match(keyOrInfoRegex) &&
				isInCatchClause(parentStatement)
			) {
				const functionCallToInsert = `assertIsAppError(${expressionMatch});\n\n`;

				// Assert is AppError does a type-narrowing assertion; meaning that it guarantees
				// TypeScript, that it would throw and thus prevents execution of the normal code-path.
				sourceFile.insertText(parentStatement.getStart(true), functionCallToInsert);

				// Make sure to the offset of the inserted call as well, so we don't stay in an infinite
				// loop
				lastPosition += functionCallToInsert.length;
			}
			// eslint-disable-next-line unused-imports/no-unused-vars
		} catch (e) {
			return;
		}
	}
}

/**
 * Get the next diagnostic which we can possible fix.
 * This way we rerun the diagnostics each time, getting an up-to-date view. Since one assertion can
 * fix multiple errors.
 */
function getNextObjectOfTypeUnknownDiagnostic(
	sourceFile: SourceFile,
	fromPosition: number,
) {
	const errorCodes = {
		objectIsOfTypeUnknown: 18046,
	};

	return sourceFile.getPreEmitDiagnostics().find((it) => {
		return (
			Object.values(errorCodes).includes(it.getCode()) &&
			(it.getStart() ?? 0) > fromPosition
		);
	});
}

function isInCatchClause(node: Node) {
	const parent = node.getParentWhile(
		(parentNode) => !parentNode.isKind(SyntaxKind.CatchClause),
	);
	return parent !== null;
}
