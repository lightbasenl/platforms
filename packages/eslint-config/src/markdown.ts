import type { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
import * as mdx from "eslint-plugin-mdx";
import typescriptEslint from "typescript-eslint";
import { globMarkdownSnippetFromGlob, GLOBS, globUse } from "./globs.js";

/**
 * Allows parsing of markdown and mdx files, adding code blocks as virtual files.
 */
export function markdownConfig() {
	return [
		{
			...mdx.flat,

			files: [GLOBS.markdown],
			processor: mdx.createRemarkProcessor({
				lintCodeBlocks: true,
			}),
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
				"import-x/no-default-export": "off",

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
					projectService: false,
					warnOnUnsupportedTypeScriptVersion: false,
					project: false,
					program: null,
				},
			},
		},
	] satisfies Array<FlatConfig.Config>;
}
