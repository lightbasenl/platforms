import consola from "consola";
import type { Context } from "../run.js";

export function printHelp(context: Context) {
	const align = 20;
	consola.log(`Usage: npx tsx ${context.configurationFile} [...flags]

Code generation based on OpenAPI specifications.

Flags:
  ${"--help".padEnd(align, " ")} Prints this help output
  ${"--resolve-types".padEnd(align, " ")} Write a file to the .cache directory to get started.
  ${" ".repeat(align)} This improves Typescript auto-completions for various configuration
  ${" ".repeat(align)} options based on your OpenAPI specifications.

Check the docs for more information at https://github.com/lightbasenl/platforms/tree/main/packages/open-api-code-gen
		`);
}
