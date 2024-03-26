import { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
import eslintConfigs from "@eslint/js";
import { GLOBS, globUse } from "./globs.js";

export function javascript(hasTypescriptEnabled: boolean) {
	if (hasTypescriptEnabled) {
		return [];
	}

	return [
		{
			files: globUse([GLOBS.javascript]),
			rules: {
				...eslintConfigs.configs.recommended.rules,
			},
		},
	] satisfies FlatConfig.Config[];
}
