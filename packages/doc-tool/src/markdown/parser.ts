import { globSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import type { Root } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { frontmatterFromMarkdown } from "mdast-util-frontmatter";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { frontmatter } from "micromark-extension-frontmatter";
import { gfm } from "micromark-extension-gfm";
import type { ContentRoot } from "../config/validate.js";
import { FileParsingError } from "../error.js";

/**
 * Represents a parsed markdown file
 */
export interface ParsedMarkdownFile {
	/**
	 * The path to the markdown file
	 */
	filePath: string;

	/**
	 * The path on disk to the file.
	 */
	absolutePath: string;

	/**
	 * The content root this file belongs to
	 */
	contentRoot: ContentRoot;

	/**
	 * The parsed AST of the markdown file
	 */
	ast: Root;

	/**
	 * The raw content of the markdown file
	 */
	content: string;
}

/**
 * Find all markdown files in the given content roots
 */
export function findMarkdownFiles(contentRoots: Array<ContentRoot>): Array<string> {
	const markdownFiles: Array<string> = [];

	for (const contentRoot of contentRoots) {
		// Find all .md files in the content root
		const files = globSync(`${contentRoot.path}/**/*.md`, {});

		// Filter out files in node_modules and dist directories
		const filteredFiles = files.filter((file) => {
			return !file.includes("/node_modules/") && !file.includes("/dist/");
		});

		markdownFiles.push(...filteredFiles);
	}

	return markdownFiles;
}

/**
 * Parse a markdown file into an AST
 * @param filePath Path to the markdown file
 * @param contentRoot Path to the content root this file belongs to
 * @returns Parsed markdown file
 */
export async function parseMarkdownFile(
	filePath: string,
	contentRoot: ContentRoot,
): Promise<ParsedMarkdownFile> {
	const content = await fs.readFile(filePath, "utf-8");

	// Parse the markdown content into an AST
	const ast = fromMarkdown(content, {
		extensions: [gfm(), frontmatter()],
		mdastExtensions: [gfmFromMarkdown(), frontmatterFromMarkdown()],
	});

	return {
		filePath,
		absolutePath: path.resolve(contentRoot.path, filePath),
		contentRoot,
		ast,
		content,
	};
}

/**
 * Find and parse all markdown files in the given content roots
 * @param contentRoots Array of content roots
 * @returns Array of parsed markdown files
 */
export async function findAndParseMarkdownFiles(
	contentRoots: Array<ContentRoot>,
): Promise<Array<ParsedMarkdownFile>> {
	const filePaths = findMarkdownFiles(contentRoots);
	const parsedFiles: Array<ParsedMarkdownFile> = [];

	for (const filePath of filePaths) {
		// Find which content root this file belongs to
		const contentRoot = contentRoots.find((root) => filePath.startsWith(root.path))!;

		try {
			const parsedFile = await parseMarkdownFile(filePath, contentRoot);
			parsedFiles.push(parsedFile);
		} catch (error) {
			throw new FileParsingError("Failed to parse markdown file", filePath, error);
		}
	}

	return parsedFiles;
}
