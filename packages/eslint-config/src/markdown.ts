import type { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
import markdown from "eslint-plugin-markdown";
import { globMarkdownSnippetFromGlob, GLOBS, globUse } from "./globs.js";

/**
 * Allows parsing of markdown files, adding code blocks as virtual files.
 */
export function markdownConfig() {
	return [
		{
			plugins: {
				markdown,
			},
		},
	] satisfies Array<FlatConfig.Config>;
}

/**
 * Load overrides for Markdown snippets. Is separate, to allow these rules to have priority.
 */
export function markdownSnippetOverrides(): Array<FlatConfig.Config> {
	return [
		{
			// Disable rules in Markdown snippets
			files: globUse([
				globMarkdownSnippetFromGlob(GLOBS.javascript),
				globMarkdownSnippetFromGlob(GLOBS.typescript),
			]),
			rules: {
				"unused-imports/no-unused-vars": "off",
			},
		},
	] satisfies Array<FlatConfig.Config>;
}
