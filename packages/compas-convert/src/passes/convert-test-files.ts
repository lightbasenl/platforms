import consola from "consola";
import type { CallExpression, SourceFile } from "ts-morph";
import { ts } from "ts-morph";
import type { Context } from "../context.js";
import { addNamedImportIfNotExists } from "../shared/import.js";
import SyntaxKind = ts.SyntaxKind;

/**
 * TODO:
 *  - Handle other usages of "t" like seedTestValuator  (not now)
 *  - Do something with: test("teardown", ...  (not now)
 *  - Handle newTestEvent(t) (not now)
 *  - Other alternative for t.pass() than expect(true).toBeTruthy();
 */

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

type TUsage = {
	command: TestCommand;
	expression: CallExpression;
	testArgumentName: string;
};

export function convertTestFiles(context: Context, sourceFile: SourceFile) {
	const filePath = sourceFile.getFilePath();
	if (filePath.includes("/generated/") || !filePath.endsWith(".test.ts")) {
		return;
	}

	if (!filePath.includes("/src/") && !filePath.includes("/plugins/")) {
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

	if (testIsParent(expression)) {
		// the test functions as grouping, so instead we use describe to define a separate suite
		expression.getFirstChild()?.replaceWithText("describe");
		addNamedImportIfNotExists(expression.getSourceFile(), "vitest", "describe", false);
	} else {
		addNamedImportIfNotExists(expression.getSourceFile(), "vitest", "test", false);
	}

	removeTestHandlerParameter(expression);

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
			case TestCommand.notEqual: {
				const actual = args[0]?.getText() ?? "false";
				const expected = args[1]?.getText() ?? "true";
				const message = args[2]?.getText() ?? "";
				it.expression.replaceWithText(
					`expect(${actual}${message ? `, ${message}` : ""}).not.toBe(${expected})`,
				);
				break;
			}
			case TestCommand.deepEqual: {
				const args = it.expression.getArguments();
				const actual = args[0]?.getText() ?? "{}";
				const expected = args[1]?.getText() ?? "true";
				const message = args[2]?.getText() ?? "";
				it.expression.replaceWithText(
					`expect(${actual}${message ? `, ${message}` : ""}).toStrictEqual(${expected})`,
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
			case TestCommand.notOk: {
				const args = it.expression.getArguments();
				const actual = args[0]?.getText() ?? "false";
				const message = args[1]?.getText() ?? "";
				it.expression.replaceWithText(
					`expect(${actual}${message ? `, ${message}` : ""}).toBeFalsy()`,
				);
				break;
			}
			case TestCommand.pass: {
				const args = it.expression.getArguments();
				const message = args[0]?.getText();
				it.expression.replaceWithText(
					`expect(true${message ? `, ${message}` : ""}).toBeTruthy()`,
				);
				break;
			}
			case TestCommand.fail: {
				const args = it.expression.getArguments();
				const message = args[0]?.getText();
				it.expression.replaceWithText(`expect.unreachable(${message ? message : ""})`);
				break;
			}
			case TestCommand.test: {
				// check if the command contains other tests
				if (testIsParent(it.expression)) {
					// the test functions as grouping, so instead we use describe to define a separate suite
					it.expression.getFirstChild()?.replaceWithText("describe");
					addNamedImportIfNotExists(
						expression.getSourceFile(),
						"vitest",
						"describe",
						false,
					);
				} else {
					it.expression.getFirstChild()?.replaceWithText("test");
					addNamedImportIfNotExists(expression.getSourceFile(), "vitest", "test", false);
				}

				if (!testUsesContext(it)) {
					removeTestHandlerParameter(it.expression);
				} else {
					replaceTestHandlerParameter(it.expression);
				}
				break;
			}
		}
	}

	if (
		usage.find((it) =>
			[
				TestCommand.equal,
				TestCommand.deepEqual,
				TestCommand.notEqual,
				TestCommand.ok,
				TestCommand.notOk,
				TestCommand.fail,
			].includes(it.command),
		)
	) {
		addNamedImportIfNotExists(expression.getSourceFile(), "vitest", "expect", false);
	}
}

/**
 * Check if the expression only contains other tests
 */
function testIsParent(expression: CallExpression): boolean {
	return getDirectDescendants(expression).every((child) =>
		child
			?.getExpression()
			.asKind(SyntaxKind.CallExpression)
			?.getExpression()
			?.getText()
			?.includes(TestCommand.test),
	);
}

/**
 * Check if the expression contains calls that use t.name
 */
function testUsesContext(usage: TUsage): boolean {
	return getDirectDescendants(usage.expression).some((child) =>
		child
			.asKind(SyntaxKind.ExpressionStatement)
			?.getExpression()
			.asKind(SyntaxKind.CallExpression)
			?.getArguments()
			.some(
				(arg) =>
					!arg.isKind(SyntaxKind.ArrowFunction) &&
					(arg.getText().includes("ctx.") ||
						arg.getText().includes(`${usage.testArgumentName}.name`)),
			),
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

	const childStatements =
		arrowFunction?.getDescendantsOfKind(SyntaxKind.CallExpression) ?? [];
	// this should normally be t but let's not be to sure
	const testArgumentName = arrowFunction.getParameters()[0]!.getName();

	const result = [];
	for (const childStatement of childStatements) {
		if (childStatement.getExpression().getText().startsWith(`${testArgumentName}.`)) {
			const command = childStatement
				.getText()
				.slice(testArgumentName.length + 1)
				.replace(/\(.+/ms, "");

			if (command in TestCommand) {
				result.push({
					command: command as TestCommand,
					expression: childStatement,
					testArgumentName,
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
	for (const arg of args) {
		if (
			!arg.isKind(SyntaxKind.ArrowFunction) &&
			arg.getText().includes(`${usage.testArgumentName}.name`)
		) {
			const searchRegex = new RegExp(`${usage.testArgumentName}.name`, "g");
			arg.replaceWithText(arg.getText().replaceAll(searchRegex, "ctx.task.name"));
		}
	}
}

/**
 * Get the immediate children of the current expression (but including code that is in sub blocks
 * like if and catch statements)
 */
function getDirectDescendants(expression: CallExpression) {
	return expression
		.getDescendantsOfKind(SyntaxKind.ExpressionStatement)
		.filter((childExpression) => {
			const containingTestExpression = childExpression.getParentWhile(
				(parent) =>
					!parent.isKind(SyntaxKind.ExpressionStatement) ||
					!parent.getExpression().isKind(SyntaxKind.CallExpression) ||
					!parent.getExpression().getText().includes(TestCommand.test),
			);
			return containingTestExpression === expression;
		});
}
