import consola from "consola";
import type { OpenAPIV3 } from "openapi-types";
import type { GeneratorTargetOutput } from "./config/target.js";
import { prepareOutputDirectory } from "./output/fs.js";
import { resolveTypesAndWrite } from "./output/resolve-types.js";
import { groupPathItems } from "./process/group-by.js";
import type { GlobalHooks } from "./process/hooks.js";
import { loadSpecificationsFromSource } from "./process/loaders.js";
import type { LoaderSource } from "./process/loaders.js";
import {
	lockedFilterPathItems,
	optionallyLoadLockFile,
	writeLockFile,
} from "./process/locked.js";
import { resolvePathItems } from "./utils/openapi.js";

export type Context<Name extends string = string> = {
	/**
	 * Support multiple generate calls in a single `generate.config.ts`.
	 */
	name: Name;

	/**
	 * The resolved configuration filepath.
	 */
	configurationFile: string;

	/**
	 * Run mode for this generate call based on '--help', '--resolve-types'  or no flag at all.
	 */
	runType: "help" | "resolve-types" | "generate";

	/**
	 * Configured schema sources
	 */
	sources: Array<LoaderSource>;

	/**
	 * Configured generator targets.
	 */
	targets: Array<GeneratorTargetOutput>;

	/**
	 * Loaded specifications
	 */
	specifications: Array<OpenAPIV3.Document>;

	/**
	 * Various hooks to transform the specifications or alter the output.
	 */
	globalHooks: GlobalHooks;
};

export async function runCodeGeneration(context: Context) {
	const loadedSpecifications = await loadSpecificationsFromSource(context.sources);
	context.specifications = loadedSpecifications.map((it) => it.openapi);

	if (context.globalHooks.beforeResolveTypes) {
		for (const spec of context.specifications) {
			context.globalHooks.beforeResolveTypes(spec);
		}
	}

	await resolveTypesAndWrite(context);

	if (context.runType === "resolve-types") {
		// TODO: make log more human friendly.
		consola.info(
			`Written output to './.cache/open-api-code-gen/'. View auto-completion on 'TODO'!.`,
		);
		return;
	}

	if (context.globalHooks.beforeGenerate) {
		for (const spec of context.specifications) {
			context.globalHooks.beforeGenerate(spec);
		}
	}

	let pathItemObjects = resolvePathItems(loadedSpecifications.map((it) => it.openapi));
	for (const target of context.targets) {
		let targetPathItemObjects = pathItemObjects;

		if (target.locked) {
			const lockfile = await optionallyLoadLockFile(target.outputDirectory);
			if (lockfile) {
				targetPathItemObjects = lockedFilterPathItems(
					"pick",
					targetPathItemObjects,
					lockfile,
				);
				pathItemObjects = lockedFilterPathItems("exclude", pathItemObjects, lockfile);
			}
		}

		await prepareOutputDirectory(target.outputDirectory);
		if (target.locked) {
			await writeLockFile(target.outputDirectory, targetPathItemObjects);
		}

		const groupedPathItems = groupPathItems(targetPathItemObjects, target.groupBy);
		consola.info(groupedPathItems);
	}
}
