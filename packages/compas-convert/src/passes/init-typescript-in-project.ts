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
	packageJson.devDependencies["tsx"] = "4.19.3";
	packageJson.devDependencies["typescript"] = "5.8.2";
	packageJson.devDependencies["vitest"] = "3.0.7";
	packageJson.devDependencies["@total-typescript/tsconfig"] = "1.0.4";
	packageJson.devDependencies["@types/node"] = "latest";
	packageJson.devDependencies["@compas/code-gen"] = "0.16.4";

	packageJson.dependencies ??= {};
	packageJson.dependencies["@lightbase/utils"] = "1.0.2";
	packageJson.dependencies["@compas/cli"] = "0.16.4";
	packageJson.dependencies["@compas/server"] = "0.16.4";
	packageJson.dependencies["@compas/stdlib"] = "0.16.4";
	packageJson.dependencies["@compas/store"] = "0.16.4";

	packageJson.scripts ??= {};
	packageJson.scripts["build"] = `tsc -p ./tsconfig.json`;
	packageJson.scripts["build:emit"] = `npm run build -- --noEmit false`;
	packageJson.scripts["test"] = "vitest";

	await writePackageJson(context);

	await writeFile(
		path.join(context.outputDirectory, "tsconfig.json"),
		`{
  "extends": "@total-typescript/tsconfig/tsc/no-dom/app",
  "compilerOptions": {
    "outDir": "./dist",
    "target": "esnext",
    "lib": ["esnext"],
    "incremental": true,
    "noEmit": true,
    "extendedDiagnostics": true,
    "erasableSyntaxOnly": true,

    // Sentry compatible sourcemap generation
    "sourceMap": true,
    "inlineSources": true,
    "sourceRoot": "/"
  },
  "exclude": ["dist"],
  "include": ["**/*"]
}
`,
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
