#!/usr/bin/env node

import { existsSync } from "node:fs";
import path from "node:path";
import consola from "consola";
import { createEmptyContext } from "./context.js";
import type { Context } from "./context.js";
import { copyRename } from "./passes/copy-rename.js";
import { fixGenerators } from "./passes/fix-generators.js";
import { initTsMorph } from "./passes/init-ts-morph.js";
import { initTypescriptInProject } from "./passes/init-typescript-in-project.js";
import { installDependencies } from "./passes/install-dependencies.js";
import { typescriptDiagnostics } from "./passes/typescript-save-and-build.js";
import { isNil } from "./utils.js";

consola.options.level = 6;
consola.options.formatOptions.depth = null;
consola.options.formatOptions.colors = true;

const [inputDirectory, outputDirectory] = process.argv.slice(2);

if (isNil(inputDirectory) || !existsSync(inputDirectory)) {
	throw new Error("Missing input directory, or the directory does not exists.");
}

if (isNil(outputDirectory) || existsSync(outputDirectory)) {
	throw new Error("Missing output directory, or the directory exists.");
}

const resolvedInputDirectory = path.resolve(inputDirectory);
const resolvedOutputDirectory = path.resolve(outputDirectory);
const context = createEmptyContext(resolvedInputDirectory, resolvedOutputDirectory);

const passes: Array<(context: Context) => void | Promise<void>> = [
	copyRename,
	initTypescriptInProject,
	installDependencies,
	initTsMorph,
	fixGenerators,

	// Always finish with available diagnostics.
	typescriptDiagnostics,
];

consola.start(`Converting ${path.relative(process.cwd(), resolvedInputDirectory)}`);
for (const pass of passes) {
	consola.info(`Running ${pass.name}`);
	await pass(context);
}

consola.ready(`All done!`);
