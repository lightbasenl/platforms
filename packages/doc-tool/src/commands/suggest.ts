import consola from "consola";
import type { Context } from "../context/types.js";

export function executeDocSuggest(context: Context) {
	consola.debug(context);

	const parsedFiles = context.files;
	if (parsedFiles) {
		consola.info(`Suggesting improvements for ${parsedFiles.length} markdown files`);
	} else {
		consola.warn("No parsed files provided, suggestions may be limited");
	}

	// TODO: Suggest glossary usage linking

	// TODO: Suggest Related Pages section.

	// TODO: Output formats: plain, interactive, PR comments/pushes

	// TODO: Output filtering: based on git-diff / selected glob.

	// TODO: Output filtering: link introduction of new glossary terms in all existing pages.

	consola.error("WIP!");
}
