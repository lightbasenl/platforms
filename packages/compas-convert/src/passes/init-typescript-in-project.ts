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
	packageJson.devDependencies["tsx"] = "4.19.1";
	packageJson.devDependencies["typescript"] = "5.6.3";
	packageJson.devDependencies["@total-typescript/tsconfig"] = "1.0.4";
	packageJson.devDependencies["@types/node"] = "latest";
	packageJson.devDependencies["@compas/code-gen"] = "0.15.0";

	packageJson.dependencies ??= {};
	packageJson.dependencies["@compas/cli"] = "0.15.0";
	packageJson.dependencies["@compas/server"] = "0.15.0";
	packageJson.dependencies["@compas/stdlib"] = "0.15.0";
	packageJson.dependencies["@compas/store"] = "0.15.0";

	packageJson.scripts ??= {};
	packageJson.scripts["build"] = `tsc -p ./tsconfig.json`;

	await writePackageJson(context);

	await writeFile(
		path.join(context.outputDirectory, "tsconfig.json"),
		`{
  "extends": "@total-typescript/tsconfig/tsc/no-dom/app",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "exclude": ["dist"],
  "include": ["**/*"]
}
`,
	);
}
