import type { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
import * as pluginImport from "eslint-plugin-import-x";
// @ts-expect-error No types available
import pluginUnusedImports from "eslint-plugin-unused-imports";
import { GLOBS, globUse } from "./globs.js";

export function imports(): Array<FlatConfig.Config> {
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
				"import-x/named": "error",
				"import-x/first": "error",
				"import-x/namespace": "off",
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
				"import-x/no-unresolved": ["error"],
				"import-x/consistent-type-specifier-style": ["error", "prefer-top-level"],

				// Make sure to disable no-unused-vars
				"no-unused-vars": "off",
				"@typescript-eslint/no-unused-vars": "off",

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
			// Handle JS config files
			files: globUse(["**/eslint.config.js", "**/next.config.js"]),
			rules: {
				"import-x/no-default-export": "off",
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
	] satisfies Array<FlatConfig.Config>;
}
