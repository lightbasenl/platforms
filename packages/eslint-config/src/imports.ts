import type { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
import * as pluginImport from "eslint-plugin-import-x";
import { GLOBS, globUse } from "./globs.js";
import type { TypeScriptConfig } from "./typescript.js";

export function imports(
	typescript: TypeScriptConfig,
	disableOrderingRules?: boolean,
): Array<FlatConfig.Config> {
	return [
		{
			// Setup import plugins.
			files: globUse([GLOBS.javascript, GLOBS.typescript]),
			plugins: {
				"import-x": pluginImport.default,
			},
			settings: {
				"import-x/resolver": {
					typescript: true,
					node: true,
				},
			},
			rules: {
				...pluginImport.configs.errors.rules,
				...pluginImport.configs.warnings.rules,

				"import-x/export": "error",
				"import-x/no-empty-named-blocks": "error",
				"import-x/no-commonjs": "error",
				"import-x/no-amd": "error",
				"import-x/first": disableOrderingRules ? "off" : "error",
				"import-x/newline-after-import":
					disableOrderingRules ? "off" : ["error", { count: 1 }],
				"import-x/no-default-export": "error",
				"import-x/order":
					disableOrderingRules ? "off" : (
						[
							"error",
							{
								"newlines-between": "never",
								"alphabetize": {
									order: "asc",
									caseInsensitive: true,
								},
							},
						]
					),
				"import-x/consistent-type-specifier-style": ["error", "prefer-top-level"],

				...(typescript ?
					{
						// Disable rules as recommended by TypeScript-eslint https://typescript-eslint.io/troubleshooting/typed-linting/performance#eslint-plugin-import
						"import-x/named": "off",
						"import-x/namespace": "off",
						"import-x/default": "off",
						"import-x/no-named-as-default-member": "off",
						"import-x/no-unresolved": "off",
						"import-x/no-rename-default": "off",
					}
				:	{
						"import-x/named": "off",
						"import-x/namespace": "off",
						"import-x/no-unresolved": "error",
						"import-x/no-rename-default": "off",
					}),
			},
		},

		{
			// Disabled rules because of missing FlatConfig compatibility.
			rules: {
				"import-x/default": "off",
				"import-x/no-named-as-default": "off",
				"import-x/no-named-as-default-member": "off",

				// Re-enable once <https://github.com/import-js/eslint-plugin-import/issues/1479> is fixed.
				// There is currently no related issue in eslint-plugin-import-x repo yet.
				"import-x/no-duplicates": "off",
			},
		},

		{
			// Default exports are required in various config files like eslint.config.js, or
			// playwright.config.ts
			files: globUse([GLOBS.rootConfigFiles]),
			rules: {
				"import-x/no-default-export": "off",
			},
		},
	] satisfies Array<FlatConfig.Config>;
}
