#!/usr/bin/env node

import { existsSync } from "node:fs";
import path from "node:path";
import consola from "consola";
import { createEmptyContext } from "./context.js";
import type { Context } from "./context.js";
import { copyRename } from "./passes/copy-rename.js";
import { initTypescript } from "./passes/init-typescript.js";
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
	initTypescript,
];

consola.start(`Converting ${path.relative(process.cwd(), resolvedInputDirectory)}`);
for (const pass of passes) {
	consola.info(`Running ${pass.name}`);
	await pass(context);
}

consola.ready(`All done!`);
