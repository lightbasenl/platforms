import { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
import { existsSync } from "node:fs";
import typescriptEslint from "typescript-eslint";
import { GLOBS, globUse } from "./globs.js";

export type TypescriptConfig =
	| boolean
	| {
			project?: boolean | string;
	  };

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
	}

	return config;
}

export function typescript(config: TypescriptConfig) {
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

		// TODO: apply a custom ruleset
		...typescriptEslint.configs.strictTypeChecked
			.filter((it) => !!it.rules)
			.map((config) => ({
				files: globUse([GLOBS.javascript, GLOBS.typescript]),
				rules: config.rules,
			})),

		{
			// TODO: extract glob
			files: globUse(["**/*.test.?(c|m)[jt]s?(x)"]),
			rules: {
				"@typescript-eslint/no-unsafe-member-access": "off",
			},
		},
	] satisfies FlatConfig.Config[];
}
