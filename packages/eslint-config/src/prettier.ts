import type { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
import type { Linter } from "eslint";
import type { Options as PrettierOptions } from "prettier";
import { formatPlugin } from "./format-plugin/index.js";
import { plainParser } from "./format-plugin/parser.js";
import {
	globIsUsed,
	globMarkdownSnippetFromGlob,
	GLOBS,
	globAsFormat,
	globUse,
} from "./globs.js";

type SupportedLanguageOverrides = "js" | "ts" | "md" | "yaml" | "json";

export interface PrettierConfig {
	/**
	 * Override default Prettier options for all supported languages.
	 */
	globalOverride?: PrettierOptions;

	/**
	 * Override default Prettier options for specific files.
	 */
	languageOverrides?: Partial<Record<SupportedLanguageOverrides, PrettierOptions>>;
}

/**
 * Apply Prettier formatting to all files.
 */
export function prettierConfig(config?: PrettierConfig) {
	// TODO: include CSS + tailwind

	// TODO: Should be drop eslint-plugin-import in favor of https://github.com/IanVS/prettier-plugin-sort-imports?

	// TODO: sql plugin

	config ??= {};

	const defaultConfig = {
		printWidth: 90,
		tabWidth: 2,
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

	// Dynamically add processors. We need just the original source to pass to Prettier. So if the
	// file is already parsed by another ESLint parser, we need to create a virtual file.
	const processors: Array<FlatConfig.Config> = [];
	const selectGlob = (a: string, processor: FlatConfig.Processor) => {
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
	const mdGlob = selectGlob(GLOBS.markdown, formatProcessor());

	const javascriptGlob = selectGlob(GLOBS.javascript, formatProcessor());
	const typescriptGlob = selectGlob(GLOBS.typescript, formatProcessor());

	return [
		...processors,

		{
			files: globUse([mdGlob, globMarkdownSnippetFromGlob(mdGlob)]),
			plugins: {
				format: formatPlugin,
			},
			languageOptions: {
				parser: plainParser,
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
				format: formatPlugin,
			},
			languageOptions: {
				parser: plainParser,
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
				format: formatPlugin,
			},
			languageOptions: {
				parser: plainParser,
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
				format: formatPlugin,
			},
			languageOptions: {
				parser: plainParser,
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
				format: formatPlugin,
			},
			languageOptions: {
				parser: plainParser,
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
	] satisfies Array<FlatConfig.Config>;
}

/**
 * Make files available under a `.format` extension. This is necessary for all filetypes that have
 * a custom parser configured.
 *
 * ESLint only supports a single parser per file-type. Through config merging, the 'plain' parser
 * we use above would always overwrite specific parsers.
 *
 * This is kinda hacky and not exactly sure what the consequences are yet...
 */
function formatProcessor(): FlatConfig.Processor {
	return {
		meta: {
			name: "lightbase:format:processor",
			version: "-",
		},
		preprocess(text: string, filename: string): Array<string | Linter.ProcessorFile> {
			// Passes through the original file, and includes one with the `.format` prefix. This is also
			// called a 'virtual' file.
			return [
				text,
				{
					text,
					filename: `${filename.split("/").pop()}.format`,
				},
			];
		},
		postprocess(messages: Array<Array<Linter.LintMessage>>): Array<Linter.LintMessage> {
			return messages.flat();
		},
		supportsAutofix: true,
	};
}
