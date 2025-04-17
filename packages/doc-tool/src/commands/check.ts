import consola from "consola";
import type { Context } from "../context/types.js";
import { findAndParseMarkdownFiles } from "../markdown/parser.js";
import { processFrontmatter } from "../repository/frontmatter.js";
import { createRepositoryState } from "../repository/index.js";

export async function executeDocCheck(context: Context) {
	consola.debug(context);

	// Resolve, normalize and parse all files in the content roots.
	const contentRoots = context.config.contentRoots;
	consola.info(`Finding and parsing markdown files.`);

	try {
		const parsedFiles = await findAndParseMarkdownFiles(contentRoots);
		consola.success(`Found and parsed ${parsedFiles.length} markdown files.`);

		// Log some basic information about the parsed files
		for (const file of parsedFiles) {
			consola.debug(`Parsed file: ${file.filePath}`);
		}

		// Create repository state
		let repoState = createRepositoryState(parsedFiles, contentRoots);

		// Process frontmatter
		consola.info("Processing frontmatter...");
		repoState = await processFrontmatter(repoState);

		// Store repository state in context
		context.repository = repoState;

		// Log frontmatter validation issues
		const issueCount = Array.from(repoState.frontmatterValidationIssues.entries()).length;
		if (issueCount > 0) {
			consola.warn(`Found ${issueCount} files with frontmatter validation issues.`);
			for (const [
				documentId,
				issues,
			] of repoState.frontmatterValidationIssues.entries()) {
				consola.warn(`Issues in ${documentId}:`);
				for (const issue of issues) {
					consola.warn(`  - ${issue}`);
				}
			}
		} else {
			consola.success("No frontmatter validation issues found.");
		}

		// TODO: TOC generation
		// This will require:
		// - Extracting headings from the AST
		// - Generating a table of contents
		// - Inserting the TOC into the document
		// - mdast-comment-marker and mdast-normalize-headings can be used for this

		// TODO: Broken link detection
		// This will require:
		// - Extracting links from the AST
		// - Resolving links to their target documents, but also resolving valid external urls'. Adding
		// special handling for detecting urls from local content roots.
		// - Checking if the target documents exist
		// - Checking if the target anchors exist

		// TODO: Page stats (most and least linked)
		// This will require:
		// - Building a link graph
		// - Calculating incoming and outgoing link counts for each document
		// - Sorting documents by link counts

		// TODO: Output formats: commit fixes, interactive, non-interactive
		// This will require:
		// - Implementing different output formats
		// - Handling user interaction for interactive mode
		// - Generating commit messages for commit mode
	} catch (error) {
		consola.error("Error parsing markdown files:", error);
		throw error;
	}
}
