import type { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
import gitignore from "eslint-config-flat-gitignore";
import { defineGlobals } from "./globals.js";
import type { GlobalsConfig } from "./globals.js";
import { globUseFromUserConfig } from "./globs.js";
import { imports } from "./imports.js";
import { javascript } from "./javascript.js";
import { markdownConfig, markdownSnippetOverrides } from "./markdown.js";
import { prettierConfig } from "./prettier.js";
import type { PrettierConfig } from "./prettier.js";
import { progress } from "./progress.js";
import type { ReactConfig } from "./react.js";
import { typescript, typescriptResolveConfig } from "./typescript.js";
import type { TypeScriptConfig } from "./typescript.js";

export type { PrettierConfig } from "./prettier.js";

interface LightbaseEslintConfigOptions {
	prettier?: false | PrettierConfig;
	typescript?: TypeScriptConfig;
	react?: ReactConfig;
	globals?: GlobalsConfig;

	/**
	 * Disable import ordering rules (`import-x/order`, `import-x/first`,
	 * `import-x/newline-after-import`). Useful when an external formatter like Oxfmt handles
	 * import sorting.
	 */
	disableImportOrdering?: boolean;
}

/**
 * Entrypoint for your everything included ESLint config.
 */
export async function defineConfig(
	opts?: LightbaseEslintConfigOptions,
	...userConfigs: Array<FlatConfig.Config>
): Promise<Array<FlatConfig.Config>> {
	globUseFromUserConfig(...userConfigs);
	opts ??= {};
	opts.typescript = typescriptResolveConfig(opts.typescript);

	const disableImportOrdering = !!opts.disableImportOrdering;

	// Only load React + related plugins if necessary. This adds quite the startup penalty otherwise.
	const reactRelatedConfig =
		opts.react ?
			await (await import("./react.js")).react(opts.react, disableImportOrdering)
		:	[];

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
		...progress(),

		// Language specifics
		...markdownConfig(),
		...javascript(),
		...typescript(opts.typescript),
		...imports(opts.typescript, disableImportOrdering),

		// Ecosystem specific
		...reactRelatedConfig,

		// Format all the things
		...(opts.prettier === false ? [] : prettierConfig(opts.prettier)),

		...userConfigs,

		...markdownSnippetOverrides(),
	] satisfies Array<FlatConfig.Config>;
}
