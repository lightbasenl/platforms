import { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
import { Linter } from "eslint";
import format from "eslint-plugin-format";
import type { Options } from "prettier";
import {
	globIsUsed,
	globMarkdownSnippetFromGlob,
	GLOBS,
	globAsFormat,
	globUse,
} from "./globs.js";
import Processor = Linter.Processor;

type PrettierConfigLanguages = "js" | "ts" | "md" | "yaml" | "json";

export interface PrettierConfig {
	globalOverride?: Options;
	languageOverrides?: { [K in PrettierConfigLanguages]?: Options };
}

/**
 * Apply Prettier formatting to all files.
 */
export function prettierConfig(config?: PrettierConfig) {
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

	const processors: FlatConfig.Config[] = [];
	const selectGlob = (a: string, processor: Processor) => {
		if (globIsUsed(a)) {
			processors.push({
				files: globUse([a]),
				processor,
			});
			return globAsFormat(a);
		}

		return a;
	};

	const yamlGlob = selectGlob(GLOBS.yaml, formatProcessor());
	const jsonGlob = selectGlob(GLOBS.json, formatProcessor());

	const javascriptGlob = selectGlob(GLOBS.javascript, formatProcessor());
	const typescriptGlob = selectGlob(GLOBS.typescript, formatProcessor());

	return [
		...processors,

		{
			files: globUse([GLOBS.markdown, globMarkdownSnippetFromGlob(GLOBS.markdown)]),
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
			files: globUse([yamlGlob]),
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
			files: globUse([jsonGlob]),
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
			files: globUse([typescriptGlob]),
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
			files: globUse([javascriptGlob]),
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
	] satisfies FlatConfig.Config[];
}

/**
 * Make files available under a `.format` extension. This is necessary for all filetypes
 * that have a custom parser configured.
 *
 * ESLint only supports a single parser per file-type. Through config merging, the 'plain'
 * parser we use above would always overwrite specific parsers.
 *
 * This is kinda hacky and not exactly sure what the consequences are yet...
 */
function formatProcessor(): Processor {
	return {
		meta: {
			name: "lightbase:format:processor",
			version: "-",
		},
		preprocess(text: string, filename: string): (string | Linter.ProcessorFile)[] {
			return [
				// Pass one through for the original file.
				text,
				{
					// Pass one with the .format suffix.
					text,
					filename: `${filename}.format`,
				},
			];
		},
		postprocess(messages: Linter.LintMessage[][]): Linter.LintMessage[] {
			return messages.flat();
		},
		supportsAutofix: true,
	};
}
