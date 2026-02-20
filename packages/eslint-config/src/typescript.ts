import { existsSync } from "node:fs";
import type { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
import typescriptEslint from "typescript-eslint";
import { GLOBS, globUse } from "./globs.js";
import { lightbaseInternalPlugin } from "./plugin/index.js";

export type TypeScriptConfig =
	| boolean
	| {
			projectService?: boolean;

			/**
			 * Compatibility path; we will over-time ignore this option to slowly migrate projects to use
			 * all recommended type-checked rules.
			 */
			disableTypeCheckedRules?: boolean;
	  };

/**
 * Resolve the provided TypeScript options.
 *
 * If `undefined` is passed, we check if a `tsconfig.json` exists in the current working directory
 * and enable the TypeScript rules if so.
 */
export function typescriptResolveConfig(config?: TypeScriptConfig): TypeScriptConfig {
	if (config === false) {
		return false;
	}

	if (config === true) {
		return {
			projectService: true,
		};
	}

	if (config === undefined) {
		if (existsSync("./tsconfig.json")) {
			return {
				projectService: true,
			};
		}

		return false;
	}

	if (config.projectService === undefined) {
		// An empty options object is passed, or an options object without projectService. Resolve
		// project as if nothing was passed. This means that we might disable Typescript support even if
		// the user explicitly passed `typescript: {}`.
		const emptyConfigResolved = typescriptResolveConfig(undefined);

		if (!emptyConfigResolved) {
			// Disable, this means that we most likely couldn't find a tsconfig.json
			return false;
		}

		if (
			typeof emptyConfigResolved === "object" &&
			emptyConfigResolved.projectService !== undefined
		) {
			config.projectService = emptyConfigResolved.projectService;

			return config;
		}
	}

	return config;
}

export function typescript(config: TypeScriptConfig): Array<FlatConfig.Config> {
	if (config === false) {
		return [];
	}

	if (typeof config === "boolean") {
		config = {
			projectService: true,
		};
	}

	return [
		{
			// Setup parser and options
			files: globUse([GLOBS.javascript, GLOBS.typescript]),
			plugins: {
				"@typescript-eslint": typescriptEslint.plugin,
			},
			languageOptions: {
				parser: typescriptEslint.parser,
				parserOptions: {
					projectService: config.projectService,
					warnOnUnsupportedTypeScriptVersion: false,
				},
			},
		},

		{
			// Enable built-in rules.
			files: globUse([GLOBS.typescript]),
			plugins: {
				lightbase: lightbaseInternalPlugin,
			},
			rules: {
				"lightbase/node-builtin-module-url-import": "error",
			},
		},

		...(config.disableTypeCheckedRules ?
			typescriptEslint.configs.recommended
		:	typescriptEslint.configs.recommendedTypeChecked
		)
			.filter((it) => !!it.rules)
			.map((config) => ({
				files: globUse([GLOBS.javascript, GLOBS.typescript]),
				rules: config.rules,
			})),

		{
			// Some stylistic types
			files: globUse([GLOBS.javascript, GLOBS.typescript]),
			rules: {
				"@typescript-eslint/array-type": [
					"error",
					{
						default: "generic",
					},
				],
				"@typescript-eslint/consistent-indexed-object-style": "error",
			},
		},

		{
			// Only available in strict, but we want these enabled always
			files: globUse([GLOBS.javascript, GLOBS.typescript]),
			rules: {
				"@typescript-eslint/no-deprecated": "error",
			},
		},

		{
			// Compat with import plugin
			files: globUse([GLOBS.javascript, GLOBS.typescript]),
			rules: {
				"@typescript-eslint/consistent-type-imports": ["error"],
			},
		},

		{
			// Error on unused vars and imports.
			files: globUse([GLOBS.javascript, GLOBS.typescript]),
			rules: {
				// Make sure to disable no-unused-vars
				"no-unused-vars": "off",
				"@typescript-eslint/no-unused-vars": [
					"error",
					{
						vars: "all",
						varsIgnorePattern: "^_",
						args: "after-used",
						argsIgnorePattern: "^_",
						caughtErrors: "all",
						caughtErrorsIgnorePattern: "^_",
						destructuredArrayIgnorePattern: "^_",
						enableAutofixRemoval: {
							imports: true,
						},
					},
				],
			},
		},
	] satisfies Array<FlatConfig.Config>;
}
