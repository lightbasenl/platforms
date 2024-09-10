import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { Context } from "../context.js";

const execAsync = promisify(exec);

/**
 * Runs npm install in the project
 */
export async function installDependencies(context: Context) {
	await execAsync(`npm install`, {
		cwd: context.outputDirectory,
	});
}
