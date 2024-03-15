import { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
import markdown from "eslint-plugin-markdown";

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
	] satisfies FlatConfig.Config[];
}
