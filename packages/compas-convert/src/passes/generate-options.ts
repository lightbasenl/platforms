import path from "node:path";
import { SyntaxKind } from "ts-morph";
import { Node } from "ts-morph";
import type { Context } from "../context.js";
import { retrievePackageJson, writePackageJson } from "../shared/package-json.js";
import { getTypescriptProgram } from "./init-ts-morph.js";

/**
 * Switch target language to TypeScript for all generate commands.
 */
export async function updateGenerateOptions(context: Context) {
	const generateCommandFile = getTypescriptProgram(context).getSourceFile(
		path.join(context.outputDirectory, "commands/generate.ts"),
	);

	if (!generateCommandFile) {
		return;
	}

	const collectedGenerateCommands: Array<{
		name: string;
		statements: string;
	}> = [];

	generateCommandFile.forEachDescendant((node, traversal) => {
		if (Node.isVariableStatement(node)) {
			// 1. Drop the `cliDefinition`
			if (node.getDeclarations().some((it) => it.getName() === "cliDefinition")) {
				node.remove();
				traversal.skip();
				return undefined;
			}
		}

		if (Node.isFunctionDeclaration(node)) {
			if (node.getName() === "cliExecutor") {
				node.forEachDescendant((childNode, nestedTraverse) => {
					if (Node.isSwitchStatement(childNode)) {
						// 2. Extract generate targets
						for (const clause of childNode.getClauses()) {
							if (Node.isDefaultClause(clause)) {
								collectedGenerateCommands.push({
									name: "default",
									statements: clause
										.getStatements()
										.map((it) => it.getText())
										.join("\n"),
								});
							} else if (Node.isCaseClause(clause)) {
								collectedGenerateCommands.push({
									name: clause.getExpression().getText(),
									statements: clause
										.getStatements()
										.map((it) => it.getText())
										.join("\n"),
								});
							}
						}

						// We usually only have one switch statement.
						nestedTraverse.stop();
						return undefined;
					}
				});

				// 3. Drop the `cliExecutor` function
				node.remove();
				// Make sure that we don't traverse in to this statement.
				traversal.skip();
				return undefined;
			}
		}

		if (Node.isCallExpression(node)) {
			// 4. Update the 'targetLanguage' in all generate calls.
			const [arg] = node.getArguments();
			const expr = node.getExpressionIfKind(SyntaxKind.PropertyAccessExpression);

			if (
				!arg ||
				!arg.isKind(SyntaxKind.ObjectLiteralExpression) ||
				!expr ||
				expr.getNameNode().getText() !== "generate"
			) {
				// 4.1 find instances of xxx.generate({ with: "object argument" })
				return;
			}

			// 4.2 find the property called 'targetLanguage'.
			const targetLanguageProperty = arg
				.getProperties()
				.find(
					(it) =>
						it.isKind(SyntaxKind.PropertyAssignment) &&
						it.getNameNode().getText() === "targetLanguage",
				);

			if (targetLanguageProperty && Node.isPropertyAssignment(targetLanguageProperty)) {
				// 4.3 update the value of 'targetLanguage'.
				targetLanguageProperty.setInitializer(`"ts"`);
			}
		}

		return undefined;
	});

	// 5. Add a new command parser
	generateCommandFile.addStatements(`
import { newLogger, environment } from "@compas/stdlib";
import { register } from "tsx/esm/api";

// TODO(compas-convert): cleanup this;
environment.NODE_ENV = "development";
register();
const opts = {
  logger: newLogger(),
  skipLint: true,
  verbose: false,
};
const logger = opts.logger;

const subCommand = process.argv[2];

switch (subCommand) {
${collectedGenerateCommands.map((it) => `${it.name === "default" ? "default:" : `case ${it.name}:`} {\n  ${it.statements}	}`).join("\n")}
}
	`);

	await generateCommandFile.save();

	// 6. Create new generate scripts.
	const packageJson = await retrievePackageJson(context);

	packageJson.scripts ??= {};
	if (
		collectedGenerateCommands.length === 1 &&
		collectedGenerateCommands[0]?.name !== "default"
	) {
		packageJson.scripts["generate"] =
			`tsx ./commands/generate.ts ${collectedGenerateCommands[0]?.name}`;
	} else {
		for (const cmd of collectedGenerateCommands) {
			if (cmd.name === "default") {
				packageJson.scripts["generate"] = `tsx ./commands/generate.ts`;
			} else {
				const name = cmd.name.replaceAll(`"`, "");
				packageJson.scripts[`generate:${name}`] = `tsx ./commands/generate.ts ${name}`;
			}
		}
	}

	await writePackageJson(context);
}
