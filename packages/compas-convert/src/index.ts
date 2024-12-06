#!/usr/bin/env node

import { existsSync } from "node:fs";
import * as fs from "node:fs";
import path from "node:path";
import consola from "consola";
import { createEmptyContext } from "./context.js";
import type { GlobalPass, Pass } from "./pass.js";
import { addCommonImports } from "./passes/add-common-imports.js";
import { isAppErrorInTestFiles } from "./passes/assert-is-app-error-in-test-files.js";
import { convertTestConfig } from "./passes/convert-test-config.js";
import { convertTestFiles } from "./passes/convert-test-files.js";
import { copyRename } from "./passes/copy-rename.js";
import { finalizePendingImports } from "./passes/finalize-pending-imports.js";
import { fixGenerators } from "./passes/fix-generators.js";
import { updateGenerateOptions } from "./passes/generate-options.js";
import { getTypescriptProgram, initTsMorph } from "./passes/init-ts-morph.js";
import { initTypescriptInProject } from "./passes/init-typescript-in-project.js";
import { installDependencies } from "./passes/install-dependencies.js";
import { notNilChecksInTestFiles } from "./passes/not-nil-checks-in-test-files.js";
import { runGenerators } from "./passes/run-generators.js";
import { transformExpressionJsDoc } from "./passes/transform-expression-js-doc.js";
import { transformModuleJsDoc } from "./passes/transform-module-js-doc.js";
import { fixTypesOfAllFunctions } from "./passes/types-of-all-functions.js";
import { fixTypesOfLiveBindings } from "./passes/types-of-live-bindings.js";
import { typescriptDiagnostics } from "./passes/typescript-save-and-build.js";
import { Cache } from "./shared/cache.js";
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

const cacheDirectory = path.resolve(
	`${path.dirname(import.meta.dirname)}/../cache/${path.basename(inputDirectory)}`,
);

if (!existsSync(cacheDirectory)) {
	fs.mkdirSync(cacheDirectory, { recursive: true });
}

const context = createEmptyContext(
	resolvedInputDirectory,
	resolvedOutputDirectory,
	cacheDirectory,
);

const passes: Array<Pass> = [
	copyRename,
	initTypescriptInProject,
	installDependencies,

	initTsMorph,

	addCommonImports,
	fixGenerators,
	fixTypesOfLiveBindings,
	fixTypesOfAllFunctions,
	updateGenerateOptions,
	convertTestFiles,
	convertTestConfig,

	transformModuleJsDoc,
	transformExpressionJsDoc,

	finalizePendingImports,
	runGenerators,

	// Re-init TS Morph. Since there is no clean way of refreshing diagnostics.
	initTsMorph,
	notNilChecksInTestFiles,
	isAppErrorInTestFiles,

	typescriptDiagnostics,
];

const cachablePasses = [
	"convertTestFiles",
	"notNilChecksInTestFiles",
	"isAppErrorInTestFiles",
	"finalizePendingImports",
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

			try {
				const cache = new Cache(context, sourceFile);
				if (cachablePasses.includes(pass.name) && cache.useIfExists()) {
					continue;
				}

				await pass(context, sourceFile);
				await sourceFile.save();

				if (cachablePasses.includes(pass.name)) {
					cache.store();
				}
			} catch (e) {
				consola.debug({
					sourceFile: sourceFile.getFilePath(),
				});
				throw e;
			}
		}
	}
}

consola.ready(`All done!`);
