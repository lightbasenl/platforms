import type { Context } from "../context.js";
import { execAsync } from "../shared/exec.js";

/**
 * Runs npm install in the project
 */
export async function installDependencies(context: Context) {
	await execAsync(`npm install`, {
		cwd: context.outputDirectory,
	});
}
