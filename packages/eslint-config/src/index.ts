import type { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
import gitignore from "eslint-config-flat-gitignore";
// @ts-expect-error no types available
import pluginFileProgress from "eslint-plugin-file-progress";
import { defineGlobals } from "./globals.js";
import type { GlobalsConfig } from "./globals.js";
import { globUseFromUserConfig } from "./globs.js";
import { imports } from "./imports.js";
import { javascript } from "./javascript.js";
import { markdownConfig, markdownSnippetOverrides } from "./markdown.js";
import { prettierConfig } from "./prettier.js";
import type { PrettierConfig } from "./prettier.js";
import type { ReactConfig } from "./react.js";
import { typescript, typescriptResolveConfig } from "./typescript.js";
import type { TypescriptConfig } from "./typescript.js";

interface LightbaseEslintConfigOptions {
	prettier?: PrettierConfig;
	typescript?: TypescriptConfig;
	react?: ReactConfig;
	globals?: GlobalsConfig;
}

/**
 * Entrypoint for your everything included ESLint config.
 */
export async function defineConfig(
	opts: LightbaseEslintConfigOptions,
	...userConfigs: Array<FlatConfig.Config>
): Promise<Array<FlatConfig.Config>> {
	globUseFromUserConfig(...userConfigs);
	opts.typescript = typescriptResolveConfig(opts.typescript);

	// Only load React + related plugins if necessary. This adds quite the startup penalty otherwise.
	const reactRelatedConfig =
		opts.react ? await (await import("./react.js")).react(opts.react) : [];

	// TODO: eslint-plugin-regex?

	return [
		// Global options
		gitignore(),
		{
			// Never format lock-files
			ignores: ["**/package-lock.json", "yarn.lock"],
		},
		{
			// Make sure to cleanup unused directives when they are not necessary anymore.
			linterOptions: {
				reportUnusedDisableDirectives: "error",
			},
		},
		...defineGlobals(opts.globals),

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

		// Language specifics
		...markdownConfig(),
		...javascript(),
		...typescript(opts.typescript),
		...imports(),

		// Ecosystem specific
		...reactRelatedConfig,

		// Format all the things
		...prettierConfig(opts.prettier),

		...userConfigs,

		...markdownSnippetOverrides(),
	] satisfies Array<FlatConfig.Config>;
}
