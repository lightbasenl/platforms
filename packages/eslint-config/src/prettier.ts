import { Linter } from "eslint";
import format from "eslint-plugin-format";
import type { Options } from "prettier";
import { GLOB_ALL_JS, GLOB_ALL_JSON, GLOB_ALL_TS, GLOB_ALL_YAML } from "./utils.js";

type PrettierConfigLanguages = "js" | "ts" | "md" | "yaml" | "json";

export interface PrettierConfig {
	globalOverride?: Options;
	languageOverrides?: { [K in PrettierConfigLanguages]?: Options };
}

/**
 * Apply Prettier formatting to all files.
 */
export function prettierConfig(config?: PrettierConfig): Linter.FlatConfig[] {
	// TODO: css + tailwind plugin

	config ??= {};

	const defaultConfig = {
		printWidth: 90,
		useTabs: true,
		semi: true,
		singleQuote: false,
		quoteProps: "consistent",
		trailingComma: "all",
		bracketSpacing: true,
		arrowParens: "always",
		proseWrap: "always",
		endOfLine: "lf",
		experimentalTernaries: true,

		...config.globalOverride,
	};

	config.languageOverrides ??= {};

	return [
		{
			files: ["**/*.md"],
			plugins: {
				format,
			},
			languageOptions: {
				parser: format.parserPlain,
			},
			rules: {
				"format/prettier": [
					"error",
					{
						parser: "markdown",
						...defaultConfig,
						...config.languageOverrides.md,
					},
				],
			},
		},
		{
			files: [GLOB_ALL_YAML],
			plugins: {
				format,
			},
			languageOptions: {
				parser: format.parserPlain,
			},
			rules: {
				"format/prettier": [
					"error",
					{
						parser: "yaml",
						...defaultConfig,
						...config.languageOverrides.yaml,
					},
				],
			},
		},
		{
			files: [GLOB_ALL_JSON],
			plugins: {
				format,
			},
			languageOptions: {
				parser: format.parserPlain,
			},
			rules: {
				"format/prettier": [
					"error",
					{
						parser: "json",
						...defaultConfig,
						...config.languageOverrides.json,
						trailingComma: "none",
					},
				],
			},
		},
		{
			files: [GLOB_ALL_TS],
			plugins: {
				format,
			},
			languageOptions: {
				parser: format.parserPlain,
			},
			rules: {
				"format/prettier": [
					"error",
					{ parser: "typescript", ...defaultConfig, ...config.languageOverrides.ts },
				],
			},
		},
		{
			files: [GLOB_ALL_JS],
			plugins: {
				format,
			},
			languageOptions: {
				parser: format.parserPlain,
			},
			rules: {
				"format/prettier": [
					"error",
					{
						parser: "typescript",
						...defaultConfig,
						...config.languageOverrides.js,
					},
				],
			},
		},
	];
}
