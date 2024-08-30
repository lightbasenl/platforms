import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PathItem } from "../utils/openapi.js";

const LOCKFILE = "./code-gen-lock.json";

type TargetLockfile = {
	pathItems: Array<string>;
};

export async function optionallyLoadLockFile(outputDirectory: string) {
	const filename = path.join(outputDirectory, LOCKFILE);

	if (existsSync(filename)) {
		const read = JSON.parse(await readFile(filename, "utf-8")) as unknown;
		return read as TargetLockfile;
	}

	return undefined;
}

export async function writeLockFile(outputDirectory: string, pathItems: Array<PathItem>) {
	const filename = path.join(outputDirectory, LOCKFILE);

	await writeFile(
		filename,
		JSON.stringify({
			pathItems: pathItems.map((it) => `${it.path} ${it.method}`),
		} satisfies TargetLockfile),
	);
}

export function lockedFilterPathItems(
	type: "pick" | "exclude",
	pathItems: Array<PathItem>,
	filter: TargetLockfile,
) {
	return pathItems.filter((it) => {
		const match = filter.pathItems.includes(`${it.path} ${it.method}`);

		if (type === "pick") {
			return match;
		} else if (type === "exclude") {
			return !match;
		}
	});
}
