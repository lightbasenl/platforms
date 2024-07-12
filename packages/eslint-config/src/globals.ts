import type { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
import globals from "globals";

export type GlobalsConfig = Array<keyof typeof globals>;

/**
 * Select globals to be available. Defaults to the fullstack experience for modern JS.
 */
export function defineGlobals(config?: GlobalsConfig): Array<FlatConfig.Config> {
	if (config === undefined) {
		config = ["node", "browser", "es2025"];
	}

	let collectedGlobals: Record<string, boolean> = {};

	for (const item of config) {
		collectedGlobals = {
			...collectedGlobals,
			...globals[item],
		};
	}

	return [
		{
			languageOptions: {
				globals: collectedGlobals,
			},
		},
	];
}
