import consola from "consola";
import type { Context } from "../context.js";
import { retrievePackageJson } from "../shared/package-json.js";
import { spawn } from "../utils.js";

/**
 * Generate all code-gen targets.
 */
export async function runGenerators(context: Context) {
	const pkgJson = await retrievePackageJson(context);
	const scripts = pkgJson.scripts ?? {};

	if (scripts["generate"]) {
		// Assume a default generate, which executes everything;
		consola.info(`Calling generate...`);

		await spawn(`npm`, ["run", "generate"], {
			cwd: context.outputDirectory,
		});
	} else {
		for (const genCommand of Object.keys(scripts)) {
			if (genCommand.startsWith("generate:")) {
				consola.info(`Calling ${genCommand}...`);

				await spawn(`npm`, ["run", genCommand], {
					cwd: context.outputDirectory,
				});
			}
		}
	}
}
