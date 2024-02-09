import { Linter } from "eslint";
import format from "eslint-plugin-format";
import markdown from "eslint-plugin-markdown";

interface Opts {}

export function defineConfig(opts: Opts, ...config: Linter.FlatConfig[]) {
	const prettierConfig = {
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
	};

	const conf: Linter.FlatConfig[] = [
		{
			ignores: [".cache", ".idea", ".next", "dist", "out"],
		},

		{
			linterOptions: {
				noInlineConfig: true,
				reportUnusedDisableDirectives: "error",
			},
		},

		{
			plugins: {
				markdown,
			},
		},
		{
			files: ["**/*.md"],
			languageOptions: {
				parser: format.parserPlain,
			},
		},
		{
			files: ["**/*.md"],
			languageOptions: {
				parser: format.parserPlain,
			},
			plugins: {
				format,
			},
			rules: {
				"format/prettier": ["error", { parser: "markdown", ...prettierConfig }],
			},
		},
		{
			files: ["**/*.[yml,yaml]"],
			languageOptions: {
				parser: format.parserPlain,
			},
			plugins: {
				format,
			},
			rules: {
				"format/prettier": ["error", { parser: "yaml", ...prettierConfig }],
			},
		},
		{
			files: ["**/*.?([cm])[jt]s?(x)"],
			languageOptions: {
				parser: format.parserPlain,
			},
			plugins: {
				format,
			},
			rules: {
				"format/prettier": ["error", { parser: "typescript", ...prettierConfig }],
			},
		},
	];

	return conf.concat(...config);
}
