import type { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
import { mergeProcessors, processorPassThrough } from "eslint-merge-processors";
import markdown from "eslint-plugin-markdown";
import typescriptEslint from "typescript-eslint";
import { globMarkdownSnippetFromGlob, GLOBS, globUse } from "./globs.js";

/**
 * Allows parsing of markdown files, adding code blocks as virtual files.
 */
export function markdownConfig() {
	return [
		{
			files: [GLOBS.markdown],
			plugins: {
				markdown,
			},
			processor: mergeProcessors([processorPassThrough, markdown.processors.markdown]),
		},
	] satisfies Array<FlatConfig.Config>;
}

/**
 * Load overrides for Markdown snippets. Is separate, to allow these rules to have priority.
 */
export function markdownSnippetOverrides(): Array<FlatConfig.Config> {
	// Disable rules in Markdown snippets

	return [
		{
			files: globUse([
				globMarkdownSnippetFromGlob(GLOBS.javascript),
				globMarkdownSnippetFromGlob(GLOBS.typescript),
			]),
			rules: {
				"unused-imports/no-unused-vars": "off",
				"import-x/no-commonjs": "off",
				"import-x/no-unresolved": "off",

				"eol-last": "off",
				"no-undef": "off",
				"no-unused-expressions": "off",
				"no-unused-vars": "off",
				"padded-blocks": "off",
				"strict": "off",
				"unicode-bom": "off",

				"react/jsx-no-undef": "off",
			},
		},

		{
			// Disable type-checked rules and TypeScript project(-service) usage for markdown snippets.
			// These snippets can't be related to a TypeScript program, so shouldn't use one.
			files: globUse([
				globMarkdownSnippetFromGlob(GLOBS.javascript),
				globMarkdownSnippetFromGlob(GLOBS.typescript),
			]),
			...typescriptEslint.configs.disableTypeChecked,
			languageOptions: {
				parserOptions: {
					EXPERIMENTAL_useProjectService: false,
					warnOnUnsupportedTypeScriptVersion: false,
					project: false,
					program: null,
				},
			},
		},
	] satisfies Array<FlatConfig.Config>;
}
