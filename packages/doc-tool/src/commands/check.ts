import consola from "consola";
import type { Context } from "../context/types.js";
import { findAndParseMarkdownFiles } from "../markdown/parser.js";

export async function executeDocCheck(context: Context) {
	consola.debug(context);

	// Resolve, normalize and parse all files in the content roots.
	const contentRoots = context.config.contentRoots;
	consola.info(`Finding and parsing markdown files.`);

	try {
		const parsedFiles = await findAndParseMarkdownFiles(contentRoots);
		context.files = parsedFiles;
		consola.success(`Found and parsed ${parsedFiles.length} markdown files.`);

		// Log some basic information about the parsed files
		for (const file of parsedFiles) {
			consola.debug(`Parsed file: ${file.filePath}`);
		}

		// TODO: Resolve + validate frontmatter options for all files.
		//   - mdast-util-frontmatter
		//   - yaml

		// TODO: TOC generation
		//   - mdast-comment-marker
		//   - mdast-normalize-headings

		// TODO: Broken link detection

		// TODO: Page stats (most and least linked).

		// TODO: Output formats: commit fixes, interactive, non-interactive.
	} catch (error) {
		consola.error("Error parsing markdown files:", error);
		throw error;
	}
}
