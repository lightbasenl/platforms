import { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
import { existsSync } from "node:fs";
import typescriptEslint from "typescript-eslint";
import { GLOBS, globUse } from "./globs.js";

export type TypescriptConfig =
	| boolean
	| {
			project?: string;
	  };

export function typescript(config?: TypescriptConfig) {
	if (config === undefined) {
		if (existsSync("./tsconfig.eslint.json")) {
			config = {
				project: "./tsconfig.eslint.json",
			};
		} else {
			config = existsSync("./tsconfig.json");
		}
	}

	if (config === false) {
		return [];
	}

	const project = typeof config === "boolean" ? config : config.project;

	return [
		{
			files: globUse([GLOBS.javascript, GLOBS.typescript]),
			plugins: {
				"@typescript-eslint": typescriptEslint.plugin,
			},
			languageOptions: {
				parser: typescriptEslint.parser,
				parserOptions: {
					project,
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
