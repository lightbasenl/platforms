/**
 * We need to keep track of used globs to prevent conflicts between language parsers and the
 * Prettier config.
 */
const USED_GLOBS = new Set();

export const GLOBS = {
	javascript: "**/*.?(c|m)js?(x)",
	typescript: "**/*.?(c|m)ts?(x)",

	markdown: "**/*.md",

	yaml: "**/*.y?(a)ml",
	json: "**/*.json?(5|c)",
};

/**
 * Keep track of all used globs. We need this to use custom globs for running Prettier in
 * ESLint.
 */
export function globUse(globs: string[]) {
	for (const glob of globs) {
		USED_GLOBS.add(glob);
	}

	return globs;
}

/**
 * Report if a glob is used.
 */
export function globIsUsed(glob: string) {
	return USED_GLOBS.has(glob);
}

/**
 * Convert any glob to a .format glob to be used with the automatically enabled format config.
 */
export function globAsFormat(glob: string) {
	return `${glob}.format`;
}

/**
 * Apply custom rules to snippets in markdown files.
 */
export function globMarkdownSnippetFromGlob(glob: string) {
	return `**/*.md/*.${glob.split("/").pop() ?? ""}`;
}
