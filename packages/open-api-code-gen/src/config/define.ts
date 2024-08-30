import path from "node:path";
import consola from "consola";
import type { GlobalHooks } from "../process/hooks.js";
import type { LoaderSource } from "../process/loaders.js";
import { runCodeGeneration } from "../run.js";
import type { Context } from "../run.js";
import { printHelp } from "./help.js";
import { targetDefaults } from "./target.js";
import type { GeneratorTarget } from "./target.js";

/**
 * Entrypoint for OpenAPI code generation.
 */
export function defineOpenApiCodeGen<Name extends string>(opts: {
	name: Name;
	sources: Array<LoaderSource>;
	targets: Array<GeneratorTarget>;
	hooks?: GlobalHooks;
}) {
	const configurationFile = path.relative(process.cwd(), process.argv[1] ?? "");
	const context: Context<Name> = {
		name: opts.name,
		configurationFile,
		runType: "generate",
		sources: opts.sources,
		targets: opts.targets?.map((it) => targetDefaults(it)) ?? [],
		specifications: [],
		globalHooks: opts.hooks ?? {},
	};

	consola.start(
		`Running @lightbase/open-api-code-gen for '${context.configurationFile}'.`,
	);

	if (process.argv.includes("--help")) {
		context.runType = "help";
	} else if (process.argv.includes("--resolve-types")) {
		context.runType = "resolve-types";
	}

	switch (context.runType) {
		case "help":
			printHelp(context);
			return;
		case "resolve-types":
		case "generate":
			runCodeGeneration(context).catch((e: unknown) => {
				consola.error(e);
			});
	}
}
