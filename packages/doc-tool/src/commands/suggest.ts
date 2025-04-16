import consola from "consola";
import type { Context } from "../context/types.js";

export function executeDocSuggest(context: Context) {
	consola.debug(context);

	// TODO: Suggest glossary usage linking

	// TODO: Suggest Related Pages section.

	// TODO: Output formats: plain, interactive, PR comments/pushes

	// TODO: Output filtering: based on git-diff / selected glob.

	// TODO: Output filtering: link introduction of new glossary terms in all existing pages.

	consola.error("WIP!");
}
