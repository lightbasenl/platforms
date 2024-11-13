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
	// Keep track of the last position, so we only move forwards in the file, and don't get stuck on
	// an expression we can't fix.
	let lastPosition = 0;

	while ((nextDiagnostic = getNextUndefinedCheckDiagnostic(sourceFile, lastPosition))) {
		lastPosition = nextDiagnostic.getStart()!;

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

		// The diagnostic text is not always helpful, so retrieve the expression from the file contents.
		// -  "'user.passwordLogin' is possible 'undefined'"
		// -  "Object is possible 'undefined''
		const expressionMatch = sourceFile
			.getFullText()
			.slice(
				nextDiagnostic.getStart(),
				nextDiagnostic.getStart()! + nextDiagnostic.getLength()!,
			);

		// Assert not nil does a type-narrowing assertion; meaning that it guarantees typescript, that
		// it would throw and thus prevents execution of the normal code-path.
		sourceFile.insertText(
			parentStatement.getStart(true),
			`assertNotNil(${expressionMatch});\n\n`,
		);
	}
}

/**
 * Get the next diagnostic which we can possible fix.
 * This way we rerun the diagnostics each time, getting an up-to-date view. Since one assertion can
 * fix multiple errors.
 */
function getNextUndefinedCheckDiagnostic(sourceFile: SourceFile, fromPosition: number) {
	const errorCodes = {
		expressionIsPossiblyUndefined: 18048,
		objectIsPossiblyUndefined: 2532,
	};

	return sourceFile
		.getPreEmitDiagnostics()
		.find(
			(it) =>
				(it.getStart() ?? 0) > fromPosition &&
				Object.values(errorCodes).includes(it.getCode()),
		);
}
