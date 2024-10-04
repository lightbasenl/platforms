import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { Context } from "../context.js";
import { retrievePackageJson, writePackageJson } from "../shared/package-json.js";

/**
 * Add a few TypeScript dependencies and create good starting TSConfig.
 */
export async function initTypescriptInProject(context: Context) {
	const packageJson = await retrievePackageJson(context);

	packageJson.devDependencies ??= {};
	packageJson.devDependencies["typescript"] = "5.6.2";
	packageJson.devDependencies["@total-typescript/tsconfig"] = "1.0.4";
	packageJson.devDependencies["@types/node"] = "latest";

	packageJson.scripts ??= {};
	packageJson.scripts["build"] = `tsc -p ./tsconfig.json`;

	await writePackageJson(context);

	await writeFile(
		path.join(context.outputDirectory, "tsconfig.json"),
		`{
	"extends": "@total-typescript/tsconfig/tsc/no-dom/app",
	"compilerOptions": {
		"outDir": "./dist",
		"target": "esnext",
    	"lib": ["esnext"]
	},
	"include": ["**/*"]
}`,
	);
}
