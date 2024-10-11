#!/usr/bin/env node

import { existsSync } from "node:fs";
import path from "node:path";
import consola from "consola";
import { createEmptyContext } from "./context.js";
import type { GlobalPass, Pass } from "./pass.js";
import { convertTestFiles } from "./passes/convert-test-files.js";
import { copyRename } from "./passes/copy-rename.js";
import { finalizePendingImports } from "./passes/finalize-pending-imports.js";
import { fixGenerators } from "./passes/fix-generators.js";
import { updateGenerateOptions } from "./passes/generate-options.js";
import { getTypescriptProgram, initTsMorph } from "./passes/init-ts-morph.js";
import { initTypescriptInProject } from "./passes/init-typescript-in-project.js";
import { installDependencies } from "./passes/install-dependencies.js";
import { runGenerators } from "./passes/run-generators.js";
import { fixTypesOfAllFunctions } from "./passes/types-of-all-functions.js";
import { fixTypesOfLiveBindings } from "./passes/types-of-live-bindings.js";
import { globOfAllTypeScriptFiles } from "./shared/project-files.js";
import { isNil } from "./utils.js";

consola.options.level = 6;
consola.options.formatOptions.depth = null;
consola.options.formatOptions.colors = true;
Error.stackTraceLimit = 20;

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

const passes: Array<Pass> = [
	copyRename,
	initTypescriptInProject,
	initTsMorph,

	// addCommonImports,
	// fixGenerators,
	// fixTypesOfLiveBindings,
	// fixTypesOfAllFunctions,
	// updateGenerateOptions,
	convertTestFiles,

    // finalizePendingImports,
	// installDependencies,
	// runGenerators,

	installDependencies,
	runGenerators,

	// typescriptDiagnostics,
];

consola.start(`Converting ${path.relative(process.cwd(), resolvedInputDirectory)}`);
for (const pass of passes) {
	consola.info(`Running ${pass.name}`);

	if (pass.length === 1) {
		// Global pass
		await (pass as GlobalPass)(context);
	} else if (pass.length === 2) {
		// Per file pass, note that these can only be added once ts-morph is has been initialized.
		const program = getTypescriptProgram(context);

		for await (const file of globOfAllTypeScriptFiles(context)) {
			const filePath = path.join(context.outputDirectory, file);
			const sourceFile = program.getSourceFile(filePath);
			if (!sourceFile) {
				continue;
			}

			await pass(context, sourceFile);
			await sourceFile.save();
		}
	}
}

consola.ready(`All done!`);
