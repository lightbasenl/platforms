import { readdir, rm } from "node:fs/promises";
import path from "node:path";
import type { Context } from "../context.js";
import { execAsync } from "../shared/exec.js";

/**
 * Initialize a git work tree and remove all files.
 *
 * This allows to work on the conversion, while still having a working main-checkout.
 */
export async function initGitWorkTree(context: Context) {
	await execAsync(
		`git worktree add --track -B typescript-convert ${context.outputDirectory} origin/typescript-convert`,
		{
			cwd: context.inputDirectory,
		},
	);

	// Remove all files, except for the .git directory.
	for (const fileOrDirectory of await readdir(context.outputDirectory, {
		withFileTypes: true,
	})) {
		if (fileOrDirectory.name.includes(".git")) {
			continue;
		}

		await rm(path.join(context.outputDirectory, fileOrDirectory.name), {
			recursive: true,
			force: true,
		});
	}
}
