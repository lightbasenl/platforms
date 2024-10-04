import consola from "consola";
import type { CallExpression, Node, SourceFile } from "ts-morph";
import { ts } from "ts-morph";
import type { Context } from "../context.js";
import { addNamedImportIfNotExists } from "../shared/import.js";
import SyntaxKind = ts.SyntaxKind;

enum TestCommand {
	equal = "equal",
	notEqual = "notEqual",
	deepEqual = "deepEqual",
	pass = "pass",
	ok = "ok",
	notOk = "notOk",
	fail = "fail",
	test = "test",
}

const testAssertions = [
	TestCommand.equal,
	TestCommand.notEqual,
	TestCommand.deepEqual,
	TestCommand.pass,
	TestCommand.ok,
	TestCommand.notOk,
	TestCommand.fail,
].map((it) => it.toString());

type TUsage = {
	command: TestCommand;
	expression: CallExpression;
	usesTestName?: boolean;
};

export function convertTestFiles(context: Context, sourceFile: SourceFile) {
	// TODO: make sure package for vitest exists

	const filePath = sourceFile.getFilePath();
	if (filePath.includes("/generated/") || !filePath.endsWith(".test.ts")) {
		return;
	}
	// TODO: temp
	if (!filePath.includes("/first/") && !filePath.includes("/second/")) {
		return;
	}

	// remove redundant test / mainTestFn compass import
	sourceFile
		.getImportDeclaration((importDeclaration) =>
			importDeclaration.getText().includes("@compas/cli"),
		)
		?.remove();

	// go over each expression statement in file
	for (const statement of sourceFile.getStatements()) {
		if (statement.isKind(SyntaxKind.ExpressionStatement)) {
			const expression = statement
				.getExpression()
				.asKindOrThrow(SyntaxKind.CallExpression);

			// remove redundant statements
			if (expression.getExpression().getText() == "mainTestFn") {
				consola.log("Removed mainTestFn");
				statement.remove();
				continue;
			}

			// is it a test? This would be a/the root test function(s)
			if (expression.getExpression().getText() == "test") {
				handleNestedTest(expression);
			}
		}
	}
}

/**
 * Handle any command performed on the t param given to the test handler, like t.equals, or t.test
 */
function handleNestedTest(expression: CallExpression) {
	const usage = getNestedUsageOfT(expression);

	if (testIsParent(usage)) {
		// the test functions as grouping, so instead we use describe to define a separate suite
		expression.getFirstChild()?.replaceWithText("describe");
		addNamedImportIfNotExists(expression.getSourceFile(), "vitest", "describe", false);
		removeTestHandlerParameter(expression);
	}

	for (const it of usage) {
		const args = it.expression.getArguments();

		// look for usage of t.name as argument
		searchAndReplaceTestNameUsage(it);

		switch (it.command) {
			case TestCommand.equal: {
				const actual = args[0]?.getText() ?? "true";
				const expected = args[1]?.getText() ?? "true";
				const message = args[2]?.getText() ?? "";
				it.expression.replaceWithText(
					`expect(${actual}${message ? `, ${message}` : ""}).toBe(${expected})`,
				);
				break;
			}
			case TestCommand.ok: {
				const args = it.expression.getArguments();
				const actual = args[0]?.getText() ?? "true";
				const message = args[1]?.getText() ?? "";
				it.expression.replaceWithText(
					`expect(${actual}${message ? `, ${message}` : ""}).toBeTruthy()`,
				);
				break;
			}
			case TestCommand.test: {
				handleNestedTest(it.expression);

				it.expression.getFirstChild()?.replaceWithText("test");
				addNamedImportIfNotExists(it.expression.getSourceFile(), "vitest", "test", false);

				// handle first argument to test handler function
				if (!it.usesTestName) {
					removeTestHandlerParameter(it.expression);
				} else {
					replaceTestHandlerParameter(it.expression);
				}
				break;
			}
		}
	}

	if (usage.find((it) => [TestCommand.equal, TestCommand.ok].includes(it.command))) {
		addNamedImportIfNotExists(expression.getSourceFile(), "vitest", "expect", false);
	}
}

/**
 * Check if the expression contains other tests and performs no assertion itself
 * @param {Array<{ command: string }>} usage
 */
function testIsParent(usage: Array<{ command: TestCommand }>): boolean {
	const childTestCount = usage.reduce((total, item) => {
		return item.command === TestCommand.test ? total + 1 : total;
	}, 0);

	return (
		childTestCount !== 0 && !usage.find((item) => testAssertions.includes(item.command))
	);
}

/**
 * Find the usage of "t" inside the test handler to execute assertions or group more tests
 */
function getNestedUsageOfT(expression: CallExpression): Array<TUsage> {
	// get the statements within the test handler function
	const arrowFunction = expression
		.getArguments()[1]!
		.asKindOrThrow(SyntaxKind.ArrowFunction);

	const childStatements = arrowFunction?.getStatements() ?? [];
	const testArgumentName = arrowFunction.getParameters()[0]!.getName();

	const result = [];
	for (const childStatement of childStatements) {
		if (!childStatement.isKind(SyntaxKind.ExpressionStatement)) {
			continue;
		}
		if (
			childStatement.getExpression().isKind(SyntaxKind.CallExpression) &&
			childStatement.getExpression().getText().startsWith(`${testArgumentName}.`)
		) {
			const command = childStatement
				.getText()
				.slice(testArgumentName.length + 1)
				.replace(/\(.+/ms, "");

			if (command in TestCommand) {
				result.push({
					command: command as TestCommand,
					expression: childStatement
						.getExpression()
						.asKindOrThrow(SyntaxKind.CallExpression),
				});
			}
		}
	}

	return result;
}

/**
 * remove the t parameter given to the test handler
 */
function removeTestHandlerParameter(expression: CallExpression) {
	expression
		.getArguments()[1]!
		.asKindOrThrow(SyntaxKind.ArrowFunction)
		?.getParameters()[0]
		?.remove();
}

/**
 * Rename the test handler first argument to ctx
 */
function replaceTestHandlerParameter(expression: CallExpression) {
	expression
		.getArguments()[1]!
		.asKindOrThrow(SyntaxKind.ArrowFunction)
		?.getParameters()[0]
		?.replaceWithText("ctx");
}

/**
 * if any of the arguments is t.name we need to pass the context to the handler and use that for
 * the name
 */
function searchAndReplaceTestNameUsage(usage: TUsage) {
	const args = usage.expression.getArguments();
	let arg: Node | undefined;
	while ((arg = args.find((arg) => arg.getText() === "t.name"))) {
		usage.usesTestName = true;
		arg.replaceWithText("ctx.test.name");
	}
}
