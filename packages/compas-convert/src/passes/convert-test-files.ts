import type { CallExpression, SourceFile } from "ts-morph";
import { SyntaxKind } from "ts-morph";
import { Node } from "ts-morph";
import type { Context } from "../context.js";

/**
 * TODO:
 *  - Handle other usages of "t" like seedTestValuator  (not now)
 *  - Do something with: test("teardown", ...  (not now)
 */

const TestCommand = {
	equal: "equal",
	notEqual: "notEqual",
	deepEqual: "deepEqual",
	pass: "pass",
	ok: "ok",
	notOk: "notOk",
	fail: "fail",
	test: "test",
} as const;

type TestCommandValue = keyof typeof TestCommand;

type TUsage = {
	command: TestCommandValue;
	expression: CallExpression;
	testArgumentName: string;
};

export function convertTestFiles(context: Context, sourceFile: SourceFile) {
	const filePath = sourceFile.getFilePath();
	if (filePath.includes("/generated/") || !filePath.endsWith(".test.ts")) {
		return;
	}

	if (
		!filePath.includes("/src/") &&
		!filePath.includes("/plugins/") &&
		!filePath.includes("/test/")
	) {
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
				statement.remove();
				continue;
			}

			// is it a test? This would be a/the root test function(s)
			if (expression.getExpression().getText() == "test") {
				handleNestedTest(expression);
			}
		}
	}

	// poor man's attempt to add comment to t.pass expression
	sourceFile.replaceWithText(
		sourceFile
			.getText()
			.replaceAll(/([ \t]*)___pass___/g, "$1// TODO: t.pass replacement\n$1"),
	);

	// clear t from newTestEvent
	sourceFile.replaceWithText(
		sourceFile.getText().replaceAll(/newTestEvent\([^)*]\)/g, "newTestEvent()"),
	);
}

/**
 * Handle any command performed on the t param given to the test handler, like t.equals, or
 * t.test
 */
function handleNestedTest(expression: CallExpression) {
	const usage = getNestedUsageOfT(expression);

	replaceArgumentUsageOfT(expression);

	if (testIsParent(expression)) {
		// the test functions as grouping, so instead we use describe to define a separate suite
		expression.getFirstChild()?.replaceWithText("describe");
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
				it.expression = it.expression.replaceWithText(
					`expect(${actual}${message ? `, ${message}` : ""}).toBe(${expected})`,
				) as CallExpression;
				break;
			}
			case TestCommand.notEqual: {
				const actual = args[0]?.getText() ?? "false";
				const expected = args[1]?.getText() ?? "true";
				const message = args[2]?.getText() ?? "";
				it.expression = it.expression.replaceWithText(
					`expect(${actual}${message ? `, ${message}` : ""}).not.toBe(${expected})`,
				) as CallExpression;
				break;
			}
			case TestCommand.deepEqual: {
				const actual = args[0]?.getText() ?? "{}";
				const expected = args[1]?.getText() ?? "true";
				const message = args[2]?.getText() ?? "";
				it.expression = it.expression.replaceWithText(
					`expect(${actual}${message ? `, ${message}` : ""}).toEqual(${expected})`,
				) as CallExpression;
				break;
			}
			case TestCommand.ok: {
				const actual = args[0]?.getText() ?? "true";
				const message = args[1]?.getText() ?? "";
				it.expression = it.expression.replaceWithText(
					`expect(${actual}${message ? `, ${message}` : ""}).toBeTruthy()`,
				) as CallExpression;
				break;
			}
			case TestCommand.notOk: {
				const actual = args[0]?.getText() ?? "false";
				const message = args[1]?.getText() ?? "";
				it.expression = it.expression.replaceWithText(
					`expect(${actual}${message ? `, ${message}` : ""}).toBeFalsy()`,
				) as CallExpression;
				break;
			}
			case TestCommand.pass: {
				const message = args[0]?.getText();
				it.expression = it.expression.replaceWithText(
					`___pass___expect(true${message ? `, ${message}` : ""}).toBeTruthy()`,
				) as CallExpression;
				break;
			}
			case TestCommand.fail: {
				const message = args[0]?.getText();
				it.expression = it.expression.replaceWithText(
					`expect.unreachable(${message ? message : ""})`,
				) as CallExpression;
				break;
			}
			case TestCommand.test: {
				// check if the command contains other tests
				if (testIsParent(it.expression)) {
					// the test functions as grouping, so instead we use describe to define a separate suite
					it.expression.getFirstChild()?.replaceWithText("describe");
				} else {
					it.expression.getFirstChild()?.replaceWithText("test");
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
}

/**
 * Check if the expression only contains other tests
 */
function testIsParent(expression: CallExpression): boolean {
	return getDirectDescendants(expression).some((child) =>
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

	const result: Array<TUsage> = [];
	for (const childStatement of childStatements) {
		const callExpressionText = childStatement.getExpression().getText();
		if (callExpressionText.startsWith(`${testArgumentName}.`)) {
			const command = childStatement
				.getText()
				.slice(testArgumentName.length + 1)
				.replace(/\(.+/ms, "");

			if (command in TestCommand) {
				result.push({
					command: command as TestCommandValue,
					expression: childStatement,
					testArgumentName,
				});
			}
		}
	}

	return result;
}

/**
 * Find usages of `t` as a parameter and replace them with `{ log }`
 */
function replaceArgumentUsageOfT(expression: CallExpression) {
	// get the statements within the test handler function
	const arrowFunction = expression
		.getArguments()[1]!
		.asKindOrThrow(SyntaxKind.ArrowFunction);

	const childStatements =
		arrowFunction?.getDescendantsOfKind(SyntaxKind.CallExpression) ?? [];

	// this should normally be t but let's not be to sure
	const testArgumentName = arrowFunction.getParameters()[0]!.getName();

	for (const childStatement of childStatements) {
		const fnName = childStatement.getExpression().getText();

		if (
			(!fnName.startsWith("seed") && !fnName.includes("Test")) ||
			fnName === "newTestEvent"
		) {
			continue;
		}

		const firstArg = childStatement.getArguments()[0];
		if (firstArg?.getText() === testArgumentName) {
			firstArg.replaceWithText(`{ log: newLogger() }`);
		}
	}
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
 * if any of the arguments is t.name we need to pass the context to the handler and use that
 * for the name
 */
function searchAndReplaceTestNameUsage(usage: TUsage) {
	const args = usage.expression.getArguments();
	for (const arg of args) {
		if (
			Node.isPropertyAccessExpression(arg) &&
			arg.getExpression().getText() === usage.testArgumentName &&
			arg.getName() === "name"
		) {
			arg.setExpression("ctx.task");
		}
	}
}

/**
 * Get the immediate children of the current expression (but including code that is in sub
 * blocks like if and catch statements)
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
