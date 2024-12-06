import type { Project } from "ts-morph";

/**
 * Conversion context.
 *
 * Note that this context is shared across all passes.
 */
export interface Context {
	inputDirectory: string;
	outputDirectory: string;
	cacheDirectory: string;
	packageJson?: PartialTypedPackageJson;
	ts?: Project;
	pendingImports: Record<
		string,
		Array<{
			moduleName: string;
			symbolName: string;
			typeOnly: boolean;
		}>
	>;
}

export interface PartialTypedPackageJson {
	scripts?: Record<string, string>;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
}

export function createEmptyContext(
	inputDirectory: string,
	outputDirectory: string,
	cacheDirectory: string,
): Context {
	return {
		inputDirectory,
		outputDirectory,
		cacheDirectory,

		pendingImports: {},
	};
}
