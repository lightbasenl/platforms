import path from "node:path";
import consola from "consola";
import { executeDocCheck } from "../commands/check.js";
import { printHelp } from "../commands/help.js";
import { executeDocSuggest } from "../commands/suggest.js";
import { createContext } from "../context/types.js";
import { ConfigValidationError } from "../error.js";
import { parseCliAndEnvironmentVariables } from "./cli-and-env.js";
import { isCalledFromEntrypoint } from "./entrypoint.js";
import { validateDocRootConfig } from "./validate.js";
import type { DocToolCliAndEnvOptions } from "./validate.js";
import type { DocumentationConfigInput } from "./validate.js";

/**
 * Entrypoint for Doc-tool automations.
 */
export function defineDocumentationConfig(opts: DocumentationConfigInput) {
	const isEntrypoint = isCalledFromEntrypoint();
	const configurationFile = path.relative(process.cwd(), process.argv[1] ?? "");
	const baseConfig = parseCliAndEnvironmentVariables(
		process.argv,
		process.env,
		process.stdout,
	);

	try {
		startDocTool(opts, baseConfig, configurationFile);
	} catch (e) {
		if (isEntrypoint) {
			if (e instanceof ConfigValidationError) {
				consola.error(e.message);
				process.exit(1);
			} else {
				throw e;
			}
		} else {
			throw e;
		}
	}
}

/**
 * Starts the documentation tool using the provided configuration options.
 */
export function startDocTool(
	opts: DocumentationConfigInput,
	baseConfig: DocToolCliAndEnvOptions,
	configurationFile: string,
): void {
	const config = validateDocRootConfig(opts, baseConfig);
	const context = createContext(config);

	switch (config.command) {
		case "help":
			printHelp({ configurationFile });
			return;
		case "check":
			consola.start(`Running @lightbase/doc-tool for '${configurationFile}'.`);
			executeDocCheck(context);
			return;
		case "suggest":
			consola.start(`Running @lightbase/doc-tool for '${configurationFile}'.`);
			executeDocCheck(context);
			executeDocSuggest(context);
			return;
	}
}
