import type { ContentRoot } from "../config/validate.js";
import type { ParsedMarkdownFile } from "../markdown/parser.js";

/**
 * Repository state for markdown documents
 */
export type RepositoryState = {
	/**
	 * Array of parsed markdown files
	 */
	parsedFiles: Array<ParsedMarkdownFile>;

	/**
	 * Map of all files by absolute path;
	 */
	parsedFilesByPath: Map<string, ParsedMarkdownFile>;

	/**
	 * Content roots configuration
	 */
	contentRoots: Array<ContentRoot>;

	/**
	 * Map of document IDs to their frontmatter data
	 */
	frontmatter: Map<string, Record<string, unknown>>;

	/**
	 * Map of document IDs to validation issues
	 */
	frontmatterValidationIssues: Map<string, Array<string>>;
};

/**
 * Create an initial repository state
 */
export function createRepositoryState(
	parsedFiles: Array<ParsedMarkdownFile>,
	contentRoots: Array<ContentRoot>,
): RepositoryState {
	return {
		parsedFiles,
		parsedFilesByPath: new Map(parsedFiles.map((it) => [generateDocumentId(it), it])),
		contentRoots,
		frontmatter: new Map(),
		frontmatterValidationIssues: new Map(),
	};
}

/**
 * Generate a unique ID for a document based on its file path
 */
export function generateDocumentId(it: ParsedMarkdownFile): string {
	// If the file path already includes the content root path, return it as is
	if (it.filePath.startsWith(it.contentRoot.path)) {
		return it.filePath;
	}

	// Otherwise, combine the content root path with the file path
	return `${it.contentRoot.path}${it.filePath}`;
}

/**
 * Get a document by its ID
 */
export function getDocumentById(
	state: RepositoryState,
	documentId: string,
): ParsedMarkdownFile | undefined {
	return state.parsedFiles.find((file) => generateDocumentId(file) === documentId);
}

/**
 * Get all documents in the repository
 */
export function getAllDocuments(state: RepositoryState): Array<ParsedMarkdownFile> {
	return state.parsedFiles;
}
