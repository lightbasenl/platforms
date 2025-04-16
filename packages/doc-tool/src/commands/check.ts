import consola from "consola";
import type { Context } from "../context/types.js";

export function executeDocCheck(context: Context) {
	consola.debug(context);

	// TODO: Resolve, normalize and parse all files in the content roots.
	//  - mdast-util-from-markdown
	//  - mdast-util-gfm

	// TODO: Resolve + validate frontmatter options for all files.
	//   - mdast-util-frontmatter
	//   - yaml

	// TODO: TOC generation
	//   - mdast-comment-marker
	//   - mdast-normalize-headings

	// TODO: Broken link detection

	// TODO: Page stats (most and least linked).

	// TODO: Output formats: commit fixes, interactive, non-interactive.

	consola.error("WIP!");
}
