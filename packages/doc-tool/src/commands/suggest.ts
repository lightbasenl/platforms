import { assertNotNil } from "@lightbase/utils";
import consola from "consola";
import type { Context } from "../context/types.js";

export function executeDocSuggest(context: Context) {
	consola.debug(context);

	// We always assume that executeDocCheck has run before this function.
	assertNotNil(context.repository);

	const parsedFiles = context.repository.parsedFiles;
	consola.info(`Suggesting improvements for ${parsedFiles.length} markdown files`);

	const _repoState = context.repository;

	// TODO: Suggest glossary usage linking
	// This will require:
	// - Identifying potential glossary terms in the content
	// - Checking if these terms are defined in a glossary
	// - Suggesting links to the glossary for these terms
	// - Make sure that it works across content roots if not disabled.

	// TODO: Suggest Related Pages section
	// This will require:
	// - Building a link graph
	// - Identifying related pages based on common links or content similarity.
	// - Rank them somehow.
	// - Suggesting a Related Pages section for pages that don't have one. Or updating an existing
	// one if better matches are found.
	// - Allow links across content roots.

	// TODO: Output formats: plain, interactive, PR comments/pushes
	// This will require:
	// - Implementing different output formats
	// - Handling user interaction for interactive mode
	// - Generating PR comments or pushes for GitHub integration

	// TODO: Output filtering: based on git-diff / selected glob
	// This will require:
	// - Integrating with git to get changed files
	// - Filtering suggestions based on the changed files
	// - OR filtering suggestions based on glob patterns for file selection

	// TODO: Output filtering: link introduction of new glossary terms in all existing pages
	// This will require:
	// - Identifying new glossary terms based on git diffs.
	// - Finding occurrences of these terms in all pages
	// - Suggesting links to the glossary for these occurrences

	consola.error("WIP!");
}
