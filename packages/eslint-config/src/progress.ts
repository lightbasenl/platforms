import type { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
// @ts-expect-error no types available
import pluginFileProgress from "eslint-plugin-file-progress";
import { globMarkdownSnippetFromGlob, globUse } from "./globs.js";

export function progress(): Array<FlatConfig.Config> {
	if (process.env.CI === "true") {
		return [];
	}

	return [
		{
			// Show a friendly spinner.
			files: ["**/*"],
			plugins: {
				"file-progress": pluginFileProgress as unknown as FlatConfig.Plugin,
			},
			rules: {
				"file-progress/activate": "warn",
			},
		},

		{
			// Don't show snippets in the progress-spinner.
			files: globUse([globMarkdownSnippetFromGlob("**/*")]),
			rules: {
				"file-progress/activate": "off",
			},
		},

		{
			// Don't show virtual format files in the progress-spinner.
			files: ["**/*.*/**/*.format"],
			rules: {
				"file-progress/activate": "off",
			},
		},
	];
}
