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
	packageJson.devDependencies["tsx"] = "4.19.2";
	packageJson.devDependencies["typescript"] = "5.7.3";
	packageJson.devDependencies["vitest"] = "3.0.4";
	packageJson.devDependencies["@total-typescript/tsconfig"] = "1.0.4";
	packageJson.devDependencies["@types/node"] = "latest";
	packageJson.devDependencies["@compas/code-gen"] = "0.16.0";

	packageJson.dependencies ??= {};
	packageJson.dependencies["@lightbase/utils"] = "1.0.2";
	packageJson.dependencies["@compas/cli"] = "0.16.0";
	packageJson.dependencies["@compas/server"] = "0.16.0";
	packageJson.dependencies["@compas/stdlib"] = "0.16.0";
	packageJson.dependencies["@compas/store"] = "0.16.0";

	packageJson.scripts ??= {};
	packageJson.scripts["build"] = `tsc -p ./tsconfig.json`;
	packageJson.scripts["test"] = "vitest";

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
  "exclude": ["dist"],
	"include": ["**/*"]
}`,
	);

	await writeFile(
		path.join(context.outputDirectory, "vitest.config.ts"),
		`import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    setupFiles: "./test/config.ts",
    expect: {
    	requireAssertions: true,
    },
    poolOptions: {
      threads: {
        isolate: false,
      },
    },
    pool: "threads",
  },
})`,
	);
}
