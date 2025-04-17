import type { RepositoryState } from "./index.js";
import { getDocumentById } from "./index.js";

/**
 * Get the TOC (Table of Contents) option for a document
 *
 * This option can be overridden in frontmatter using the `toc` property
 *
 * @param state Repository state
 * @param documentId Document ID
 * @returns Whether TOC should be generated for this document
 */
export function getTocOption(state: RepositoryState, documentId: string): boolean {
	const document = getDocumentById(state, documentId);
	if (!document) {
		return false;
	}

	// Get the document's frontmatter
	const frontmatter = state.frontmatter.get(documentId) || {};

	// Check if the toc option is specified in frontmatter
	if ("toc" in frontmatter) {
		if (frontmatter.toc === true || frontmatter.toc === "true" || frontmatter.toc === 1) {
			return true;
		} else if (
			frontmatter.toc === false ||
			frontmatter.toc === "false" ||
			frontmatter.toc === 0
		) {
			return false;
		}
	}

	// Fall back to the content root's default
	return document.contentRoot.toc;
}

/**
 * Get the related pages option for a document
 *
 * This option can be overridden in frontmatter using the following properties:
 * - related_pages: boolean
 * - related_pages_name: string
 * - related_pages_max: number
 *
 * @param state Repository state
 * @param documentId Document ID
 * @returns Related pages configuration for this document
 */
export function getRelatedPagesOption(
	state: RepositoryState,
	documentId: string,
): { enabled: boolean; name: string; max: number } {
	const document = getDocumentById(state, documentId);
	if (!document) {
		return { enabled: false, name: "Related pages", max: 5 };
	}

	// Get the document's frontmatter
	const frontmatter = state.frontmatter.get(documentId) || {};

	// Get the content root's default
	const contentRoot = document.contentRoot;
	const defaultRelatedPages = contentRoot.relatedPages;

	// Default values
	let enabled =
		typeof defaultRelatedPages === "boolean" ? defaultRelatedPages : (
			defaultRelatedPages !== undefined
		);

	let name =
		typeof defaultRelatedPages === "object" && defaultRelatedPages?.name ?
			defaultRelatedPages.name
		:	"Related pages";

	let max =
		typeof defaultRelatedPages === "object" && defaultRelatedPages?.max ?
			defaultRelatedPages.max
		:	5;

	// Override with frontmatter values if present
	if ("related_pages" in frontmatter) {
		if (
			frontmatter.related_pages === true ||
			frontmatter.related_pages === "true" ||
			frontmatter.related_pages === 1
		) {
			enabled = true;
		} else if (
			frontmatter.related_pages === false ||
			frontmatter.related_pages === "false" ||
			frontmatter.related_pages === 0
		) {
			enabled = false;
		}
		enabled = Boolean(frontmatter.related_pages);
	}

	if (
		"related_pages_name" in frontmatter &&
		typeof frontmatter.related_pages_name === "string"
	) {
		name = frontmatter.related_pages_name;
	}

	if (
		"related_pages_max" in frontmatter &&
		typeof frontmatter.related_pages_max === "number"
	) {
		max = frontmatter.related_pages_max;
	}

	return { enabled, name, max };
}

/**
 * Get all file options with frontmatter overrides
 *
 * @param state Repository state
 * @param documentId Document ID
 * @returns All options for this document
 */
export function getFileOptions(
	state: RepositoryState,
	documentId: string,
): {
	toc: boolean;
	relatedPages: { enabled: boolean; name: string; max: number };
} {
	return {
		toc: getTocOption(state, documentId),
		relatedPages: getRelatedPagesOption(state, documentId),
	};
}
