import { existsSync } from "node:fs";
import type { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
import typescriptEslint from "typescript-eslint";
import { GLOBS, globUse } from "./globs.js";
import { lightbaseInternalPlugin } from "./plugin/index.js";

export type TypescriptConfig =
	| boolean
	| {
			project?: boolean | string;
			disableTypeCheckedRules?: boolean;
	  };

/**
 * Infer the correct tsconfig to use, or let typescript-eslint figure it out if 'true' is
 * explicitly passed.
 *
 * Prefers `tsconfig.eslint.json` over `tsconfig.json`. This distinction might be necessary,
 * since typescript-eslint expects all files to be part of the compile unit, but that might
 * not be needed for normal builds.
 */
export function typescriptResolveConfig(config?: TypescriptConfig): TypescriptConfig {
	if (config === false) {
		return false;
	}

	if (config === true) {
		config = {
			project: true,
		};
	}

	if (config === undefined) {
		if (existsSync("./tsconfig.eslint.json")) {
			config = {
				project: "./tsconfig.eslint.json",
			};
		} else if (existsSync("./tsconfig.json")) {
			config = {
				project: "./tsconfig.json",
			};
		} else {
			config = false;
		}
	} else if (config.project === undefined) {
		// An empty options object is passed, or an options object without project. Resolve
		// project as if nothing was passed. This means that we might disable Typescript support
		// even if the user explicitly passed `typescript: {}`.
		const emptyConfigResolved = typescriptResolveConfig(undefined);

		if (
			typeof emptyConfigResolved === "object" &&
			"project" in emptyConfigResolved &&
			emptyConfigResolved.project
		) {
			config.project = emptyConfigResolved.project;
		} else if (!emptyConfigResolved) {
			// If undefined or false is returned, we disable, even if other config props are passed.
			return false;
		}
	}

	return config;
}

export function typescript(config: TypescriptConfig): Array<FlatConfig.Config> {
	if (config === false) {
		return [];
	}

	if (typeof config === "boolean") {
		config = {
			project: true,
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
					project: config.project,
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
			// Compat with import plugin
			files: globUse([GLOBS.javascript, GLOBS.typescript]),
			rules: {
				"@typescript-eslint/consistent-type-imports": ["error"],
			},
		},
	] satisfies Array<FlatConfig.Config>;
}
