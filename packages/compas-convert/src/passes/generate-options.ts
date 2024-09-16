import { Node, SyntaxKind } from "ts-morph";
import type { Context } from "../context.js";
import { getTypescriptProgram } from "./init-ts-morph.js";

/**
 * Switch target language to TypeScript for all generate commands.
 */
export async function updateGenerateOptions(context: Context) {
	const generateCommand = getTypescriptProgram(context).getSourceFile(
		"./commands/generate.js",
	);
	if (!generateCommand) {
		return;
	}

	for (const fn of generateCommand.getFunctions()) {
		fn.forEachChild((child) => {
			if (Node.isCallExpression(child)) {
				const [arg] = child.getArguments();
				const expr = child.getExpressionIfKind(SyntaxKind.PropertyAccessExpression);

				if (
					!arg ||
					!arg.isKind(SyntaxKind.ObjectLiteralExpression) ||
					!expr ||
					expr.getNameNode().getText() !== "generate"
				) {
					return;
				}

				const targetLanguageProperty = arg
					.getProperties()
					.find(
						(it) =>
							it.isKind(SyntaxKind.PropertyAssignment) &&
							it.getNameNode().getText() === "targetLanguage",
					);

				if (targetLanguageProperty) {
					targetLanguageProperty.remove();
				}

				arg.addPropertyAssignment({
					name: "targetLanguage",
					initializer: "ts",
				});
			}
		});
	}

	await generateCommand.save();
}
