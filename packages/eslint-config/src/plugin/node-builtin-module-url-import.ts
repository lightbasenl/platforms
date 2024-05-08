import { builtinModules } from "node:module";
import type { AnyRuleModule } from "@typescript-eslint/utils/ts-eslint";

// Ported from Compas:
// https://github.com/compasjs/compas/blob/72dd8e0df5b315f87d1caf3f101af283db14867c/packages/eslint-plugin/lint-rules/node-builtin-module-url-import.js
export const nodeBuiltinModuleUrlImport: AnyRuleModule = {
	meta: {
		type: "suggestion",
		docs: {
			description: `Suggest that imports of Node.js builtin modules use the 'node:' specifier.`,
		},
		fixable: "code",
		hasSuggestions: true,

		messages: {
			consistentImport: `Always use the 'node:' specifier when importing Node.js builtins.`,
			replaceImport: `Replace '{{value}}' with 'node:{{value}}'`,
		},

		schema: [],
	},

	defaultOptions: [],

	create(context) {
		return {
			ImportDeclaration(node) {
				// Note that builtinModules doesn't include the `node:` specifier, so we automatically skip
				// these once fixed.
				if (!builtinModules.includes(node.source.value)) {
					return;
				}

				context.report({
					node: node,
					messageId: "consistentImport",
					fix: (fixer) => fixer.replaceText(node.source, `"node:${node.source.value}"`),
					suggest: [
						{
							messageId: "replaceImport",
							data: {
								value: node.source.value,
							},
							fix: (fixer) =>
								fixer.replaceText(node.source, `"node:${node.source.value}"`),
						},
					],
				});
			},
		};
	},
};
