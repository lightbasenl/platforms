import { Linter } from "eslint";
import { markdownConfig } from "./markdown.js";
import { PrettierConfig, prettierConfig } from "./prettier.js";

interface Opts {
	prettier?: PrettierConfig;
}

export function defineConfig(opts: Opts, ...config: Linter.FlatConfig[]) {
	const conf: Linter.FlatConfig[] = [
		{
			// TODO: Add automatic ignores based on .gitignore
			ignores: [".cache", ".idea", ".next", "dist", "out", "package-lock.json"],
		},

		{
			linterOptions: {
				noInlineConfig: true,
				reportUnusedDisableDirectives: "error",
			},
		},

		...markdownConfig(),
		...prettierConfig(opts.prettier),
	];

	return conf.concat(...config);
}
