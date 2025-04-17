import { isRecord } from "@lightbase/utils";
import type { Root, Yaml } from "mdast";
import { parse as parseYaml } from "yaml";
import type { ContentRoot } from "../config/validate.js";
import { FrontmatterParsingError } from "../error.js";
import type { ParsedMarkdownFile } from "../markdown/parser.js";
import type { RepositoryState } from "./index.js";
import { generateDocumentId } from "./index.js";

/**
 * Extract frontmatter from a markdown file
 */
export function extractFrontmatter(file: ParsedMarkdownFile): Record<string, unknown> {
	try {
		// Find the frontmatter node in the AST
		const frontmatterNode = findFrontmatterNode(file.ast);

		if (!frontmatterNode) {
			return {};
		}

		// Parse the frontmatter content as YAML
		const frontmatterContent = frontmatterNode.value;
		const parsedFrontmatter = parseYaml(frontmatterContent) as unknown;

		// Ensure the result is an object
		if (!isRecord(parsedFrontmatter)) {
			return {};
		}

		return parsedFrontmatter;
	} catch (error) {
		throw new FrontmatterParsingError(
			"Failed to parse frontmatter",
			file.filePath,
			error,
		);
	}
}

/**
 * Find the frontmatter node in the AST
 */
function findFrontmatterNode(ast: Root): Yaml | undefined {
	// Look for a yaml node at the beginning of the document
	const firstNode = ast.children[0];

	if (firstNode && firstNode.type === "yaml") {
		return firstNode;
	}

	return undefined;
}

/**
 * Validate frontmatter against the content root's validation schema
 */
export async function validateFrontmatter(
	frontmatter: Record<string, unknown>,
	contentRoot: ContentRoot,
): Promise<Array<string>> {
	// Skip validation if no validation schema is provided
	if (!contentRoot.validateFrontmatter) {
		return [];
	}

	// Use the content root's validation schema to validate the frontmatter
	const validationResult =
		await contentRoot.validateFrontmatter["~standard"].validate(frontmatter);

	if (validationResult.issues) {
		// Return validation issues as strings
		return validationResult.issues.map((issue) => JSON.stringify(issue));
	}

	return [];
}

/**
 * Process frontmatter for all files in the repository
 *
 * This function extracts frontmatter from all files, validates it,
 * and updates the repository state with the results
 */
export async function processFrontmatter(
	state: RepositoryState,
): Promise<RepositoryState> {
	// Create new maps for frontmatter and validation issues
	const frontmatter = new Map<string, Record<string, unknown>>();
	const frontmatterValidationIssues = new Map<string, Array<string>>();

	// Process each file
	for (const file of state.parsedFiles) {
		const documentId = generateDocumentId(file);

		// Extract frontmatter
		const extractedFrontmatter = extractFrontmatter(file);
		frontmatter.set(documentId, extractedFrontmatter);

		// Validate frontmatter
		const validationIssues = await validateFrontmatter(
			extractedFrontmatter,
			file.contentRoot,
		);
		if (validationIssues.length > 0) {
			frontmatterValidationIssues.set(documentId, validationIssues);
		}
	}

	// Return updated state
	return {
		...state,
		frontmatter,
		frontmatterValidationIssues,
	};
}
