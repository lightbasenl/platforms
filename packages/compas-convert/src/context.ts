/**
 * Conversion context.
 *
 * Note that this context is shared across all passes.
 */
export interface Context {
	inputDirectory: string;
	outputDirectory: string;
	packageJson?: PartialTypedPackageJson;
}

export interface PartialTypedPackageJson {
	scripts?: Record<string, string>;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
}

export function createEmptyContext(
	inputDirectory: string,
	outputDirectory: string,
): Context {
	return {
		inputDirectory,
		outputDirectory,
	};
}
