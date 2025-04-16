import type { DocToolConfig } from "../config/validate.js";
import { nonInteractiveReporter } from "../reporter/non-interactive.js";
import type { Reporter } from "../reporter/types.js";

export type Context = {
	config: DocToolConfig;

	reporter: Reporter;
};

export function createContext(config: DocToolConfig) {
	const reporter = (
		{
			"github": nonInteractiveReporter,
			"interactive": nonInteractiveReporter,
			"non-interactive": nonInteractiveReporter,
		} as const
	)[config.reporter];

	return {
		config,
		reporter,
	};
}
