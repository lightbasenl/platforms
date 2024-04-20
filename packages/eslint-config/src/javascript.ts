import eslintConfigs from "@eslint/js";
import typescriptEslintParser from "@typescript-eslint/parser";
import type { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
import pluginJsDoc from "eslint-plugin-jsdoc";
import { GLOBS, globUse } from "./globs.js";
import { lightbaseInternalPlugin } from "./plugin/index.js";

export function javascript(): Array<FlatConfig.Config> {
	return [
		{
			// Use the Typescript parser even if we don't Typescript. This allows us to use 'modern'
			// JS features even if the built-in espree parser doesn't support it.
			files: globUse([GLOBS.javascript]),
			languageOptions: {
				parser: typescriptEslintParser,
				parserOptions: {
					project: false,
				},
			},
		},

		{
			// We include TS here. typescript-eslint will disable conflicting rules.
			files: globUse([GLOBS.javascript, GLOBS.typescript]),
			rules: {
				...eslintConfigs.configs.recommended.rules,

				"default-case-last": "error",
				"default-param-last": "error",
				"no-console": ["error", { allow: ["dir", "time", "timeEnd"] }],
				"no-else-return": "error",
				"no-eq-null": "error",
				"no-labels": "error",
				"no-promise-executor-return": "error",
				"no-return-assign": "error",
				"no-sequences": "error",
				"no-throw-literal": "error",
				"no-unsafe-optional-chaining": ["error", { disallowArithmeticOperators: true }],
				"no-var": "error",
				"prefer-const": "error",
				"prefer-promise-reject-errors": "error",
				"prefer-template": "error",
				"require-await": "error",
				"no-constant-binary-expression": "error",

				"no-process-exit": "off",
				"no-mixed-spaces-and-tabs": "off",
			},
		},

		{
			// Internal plugin rules ;)
			files: globUse([GLOBS.javascript]),
			plugins: {
				lightbase: lightbaseInternalPlugin,
			},
			rules: {
				"lightbase/node-builtin-module-url-import": "error",
				"lightbase/compas-check-event-name": "error",
				"lightbase/compas-enforce-event-stop": "error",
			},
		},

		{
			// Pretty strict JSDoc configuration, so a jsconfig.json can be used in JS only projects.
			files: globUse([GLOBS.javascript]),
			plugins: {
				jsdoc: pluginJsDoc,
			},
			settings: {
				jsdoc: {
					mode: "typescript",
					preferredTypes: {
						"Object": "object",
						"object<>": "Record<>",
						"Object<>": "Record<>",
						"object.<>": "Record<>",
						"Object.<>": "Record<>",
						"Array.<>": "Array<>",
						"[]": "Array<>",
						"String": "string",
						"Boolean": "boolean",
						"Number": "number",
					},
				},
			},
			rules: {
				"jsdoc/check-alignment": "error",
				"jsdoc/check-examples": "off",
				"jsdoc/check-indentation": "off",
				"jsdoc/check-line-alignment": ["error", "never", { wrapIndent: "  " }],
				"jsdoc/check-param-names": "error",
				"jsdoc/check-property-names": "error",
				"jsdoc/check-syntax": "error",
				"jsdoc/check-tag-names": ["error", { definedTags: [] }],
				"jsdoc/check-types": ["error"],
				"jsdoc/check-values": "error",
				"jsdoc/empty-tags": "error",
				"jsdoc/require-asterisk-prefix": "error",
				"jsdoc/require-hyphen-before-param-description": ["error", "never"],
				"jsdoc/require-param-name": "error",
				"jsdoc/require-property": "error",
				"jsdoc/require-property-name": "error",
				"jsdoc/require-property-type": "error",
				"jsdoc/require-returns-check": "off",
				"jsdoc/require-returns-description": "off",
				"jsdoc/require-returns-type": "error",
				"jsdoc/tag-lines": [
					"error",
					"never",
					{
						startLines: 1,
						endLines: 0,
						tags: {
							deprecated: { lines: "any" },
							public: { lines: "any" },
							private: { lines: "any" },
							see: { lines: "any" },
							since: { lines: "any" },
							summary: { lines: "any" },
							template: { lines: "any" },
						},
					},
				],
				"jsdoc/valid-types": "off",
			},
		},
	] satisfies Array<FlatConfig.Config>;
}
