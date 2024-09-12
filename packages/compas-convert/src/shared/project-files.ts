import { glob } from "node:fs/promises";
import type { Context } from "../context.js";

/**
 * All ts files in the project, excluding node_modules
 */
export function globOfAllTypeScriptFiles(context: Context) {
	return glob(["./{,!(node_modules)/**}/*.ts"], {
		cwd: context.outputDirectory,
	});
}
