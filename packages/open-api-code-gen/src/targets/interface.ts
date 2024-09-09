import type { GeneratorFile } from "../output/fs.js";
import type { PathItem } from "../utils/openapi.js";

export interface TargetImplementation {
	init?: () => void;
	initGroup?: (group: string) => void;
	generateForPathItem?: (group: string, pathItem: PathItem) => void;
	filesToWrite: () => Array<GeneratorFile>;
}

export function callTarget<K extends keyof TargetImplementation>(
	implementation: TargetImplementation,
	fn: K,
	args: Parameters<Required<TargetImplementation>[K]>,
): ReturnType<Required<TargetImplementation>[K]> | undefined {
	if (fn in implementation && typeof implementation[fn] === "function") {
		// @ts-expect-error its correct.
		return implementation[fn](...args);
	}

	return undefined;
}
