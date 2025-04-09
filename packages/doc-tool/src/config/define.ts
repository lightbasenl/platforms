import path from "node:path";
import consola from "consola";
import { printHelp } from "./help.js";

type Config = {
	contentRoots: Array<{
		toc?: boolean;
	}>;
};

/**
 * Entrypoint for OpenAPI code generation.
 */
export function defineDocumentationConfig(_opts: Config) {
	const configurationFile = path.relative(process.cwd(), process.argv[1] ?? "");
	let runType: "help" | "check" | "suggest" = "check";

	if (process.argv.includes("--help")) {
		runType = "help";
	} else if (process.argv.includes("suggest")) {
		runType = "suggest";
	}

	switch (runType) {
		case "help":
			printHelp({ configurationFile });
			return;
		case "check":
		case "suggest":
			consola.start(`Running @lightbase/doc-tool for '${configurationFile}'.`);
			consola.error("WIP!");
	}
}
