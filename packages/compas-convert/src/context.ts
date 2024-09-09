/**
 * Conversion context.
 *
 * Note that this context is shared across all passes.
 */
export interface Context {
	inputDirectory: string;
	outputDirectory: string;
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
