import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Context, PartialTypedPackageJson } from "../context.js";

/**
 * Read (and cache) the package.json.
 *
 * Note that for writing, usages should mutate the returned object.
 */
export async function retrievePackageJson(
	context: Context,
): Promise<PartialTypedPackageJson> {
	if (context.packageJson) {
		return context.packageJson;
	}

	const packageJsonPath = path.join(context.outputDirectory, "package.json");

	if (!existsSync(packageJsonPath)) {
		throw new Error("Couldn't read the package.json.");
	}

	context.packageJson = JSON.parse(
		await readFile(packageJsonPath, "utf-8"),
	) as PartialTypedPackageJson;
	return context.packageJson;
}

/**
 * Write the cached package.json to disk.
 */
export async function writePackageJson(context: Context) {
	if (!context.packageJson) {
		return;
	}

	await writeFile(
		path.join(context.outputDirectory, "package.json"),
		JSON.stringify(context.packageJson, null, "\t"),
	);
}
