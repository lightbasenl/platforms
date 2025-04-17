import type { DocToolConfig } from "../config/validate.js";
import { nonInteractiveReporter } from "../reporter/non-interactive.js";
import type { Reporter } from "../reporter/types.js";
import type { RepositoryState } from "../repository/index.js";

export type Context = {
	config: DocToolConfig;

	reporter: Reporter;

	/**
	 * Repository state for markdown documents.
	 *
	 * This is initialized after files are parsed.
	 */
	repository?: RepositoryState;
};

export function createContext(config: DocToolConfig): Context {
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
