import { mkdir, readdir, cp } from "node:fs/promises";
import path from "node:path";
import consola from "consola";
import type { Context } from "../context.js";

const ignoredPaths = [
	"node_modules",
	".git",
	".cache",
	"dist",
	"snapshot",
	"coverage",
	".idea",
	".vscode",
	"logs",
	".clinic",
	"out",
	"package-lock.json",
	"jsconfig.json",
	"generated",
];

const filesThatShouldNotBeRenamed = ["eslint.config.js"];
const directoriesThatShouldNotBeRenamed = ["vendor/backend"];

/**
 * Copy all sources files from the source to target directory. Renaming them in the process.
 *
 * By default, ignores node_modules, .git, etc.
 */
export async function copyRename(context: Context) {
	await mkdir(context.outputDirectory, { recursive: true });

	for (const fileOrDirectory of await readdir(context.inputDirectory, {
		withFileTypes: true,
	})) {
		if (ignoredPaths.includes(fileOrDirectory.name)) {
			continue;
		}

		if (fileOrDirectory.isFile()) {
			await cp(
				path.join(context.inputDirectory, fileOrDirectory.name),
				transformFilename(path.join(context.outputDirectory, fileOrDirectory.name)),
			);
		} else if (fileOrDirectory.isDirectory()) {
			// Recurse into directories. Not the most efficient, but should work for now.
			await copyRename({
				inputDirectory: path.join(context.inputDirectory, fileOrDirectory.name),
				outputDirectory: path.join(context.outputDirectory, fileOrDirectory.name),
			} as Context);
		} else {
			consola.error({
				message: "Unsupported 'file' while copying the files to the output folder.",
				fileOrDirectory,
				context: {
					inputDirectory: context.inputDirectory,
					outputDirectory: context.outputDirectory,
				},
			});
		}
	}
}

function transformFilename(filename: string) {
	if (!filename.endsWith(".js")) {
		return filename;
	}

	for (const skipFile of filesThatShouldNotBeRenamed) {
		if (filename.endsWith(skipFile)) {
			return filename;
		}
	}

	for (const skipDir of directoriesThatShouldNotBeRenamed) {
		if (filename.includes(skipDir)) {
			return filename;
		}
	}

	return `${filename.slice(0, -3)}.ts`;
}
