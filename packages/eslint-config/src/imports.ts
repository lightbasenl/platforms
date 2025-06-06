import type { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
import * as pluginImport from "eslint-plugin-import-x";
import pluginUnusedImports from "eslint-plugin-unused-imports";
import { GLOBS, globUse } from "./globs.js";
import type { TypeScriptConfig } from "./typescript.js";

export function imports(typescript: TypeScriptConfig): Array<FlatConfig.Config> {
	return [
		{
			// Setup import plugins. Includes unused-imports, to automatically remove them.
			// This might not be the best experience if imports are added manually,
			// but most people use auto-imports anyway (?!).
			files: globUse([GLOBS.javascript, GLOBS.typescript]),
			plugins: {
				"import-x": pluginImport.default,
				"unused-imports": pluginUnusedImports as FlatConfig.Plugin,
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
				"import-x/first": "error",
				"import-x/newline-after-import": ["error", { count: 1 }],
				"import-x/no-default-export": "error",
				"import-x/order": [
					"error",
					{
						"newlines-between": "never",
						"alphabetize": {
							order: "asc",
							caseInsensitive: true,
						},
					},
				],
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

				// Make sure to disable no-unused-vars
				"no-unused-vars": "off",
				"@typescript-eslint/no-unused-vars": "off",

				// Auto-remove unused imports. This overrules the no-unused-vars rule as well, so we
				// configure it here.
				"unused-imports/no-unused-imports": "error",
				"unused-imports/no-unused-vars": [
					"error",
					{
						vars: "all",
						varsIgnorePattern: "^_",
						args: "after-used",
						argsIgnorePattern: "^_",
						caughtErrors: "all",
						caughtErrorsIgnorePattern: "^_",
						destructuredArrayIgnorePattern: "^_",
					},
				],
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
