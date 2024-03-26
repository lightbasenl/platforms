import { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
import { globUse } from "./globs.js";
import { javascript } from "./javascript.js";
import { markdownConfig } from "./markdown.js";
import { prettierConfig, PrettierConfig } from "./prettier.js";
import { typescript, TypescriptConfig, typescriptResolveConfig } from "./typescript.js";

interface Opts {
	prettier?: PrettierConfig;
	typescript?: TypescriptConfig;
}

export function defineConfig(opts: Opts, ...userConfigs: FlatConfig.Config[]) {
	// Register all globs in use by custom configs. This is needed since we apply
	// those after the Prettier configuration. The Prettier config then uses a processor
	// to prevent parser conflicts.
	for (const conf of userConfigs) {
		if (conf.files) {
			for (const glob of conf.files.flat()) {
				if (typeof glob === "string") {
					globUse([glob]);
				}
			}
		}
	}

	opts.typescript = typescriptResolveConfig(opts.typescript);

	return [
		// Global options
		{
			// TODO: Add automatic ignores based on .gitignore
			ignores: [".cache", ".idea", ".next", "dist", "out", "package-lock.json"],
		},

		{
			linterOptions: {
				reportUnusedDisableDirectives: "error",
			},
		},

		// Language specifics
		...markdownConfig(),
		...javascript(!!opts.typescript),
		...typescript(opts.typescript),

		// Ecosystem specific

		// Format all the things
		...prettierConfig(opts.prettier),

		...userConfigs,
	] satisfies FlatConfig.Config[];
}
