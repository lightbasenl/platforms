import { describe, expect, it } from "vitest";
import type { ContentRoot } from "../../src/config/validate.js";
import type { ParsedMarkdownFile } from "../../src/markdown/parser.js";
import { processFrontmatter } from "../../src/repository/frontmatter.js";
import { createRepositoryState } from "../../src/repository/index.js";
import {
	getTocOption,
	getRelatedPagesOption,
	getFileOptions,
} from "../../src/repository/options.js";

// Helper function to create a mock content root
function createMockContentRoot(options: Partial<ContentRoot> = {}): ContentRoot {
	return {
		path: "/test",
		baseUrl: "/",
		shareGlossary: true,
		toc: true,
		validateFrontmatter: {
			"~standard": {
				vendor: "mock",
				version: 1,
				validate: () => ({ issues: [] }),
			},
		},
		relatedPages: {
			name: "Related pages",
			max: 5,
		},
		...options,
	};
}

// Helper function to create a mock parsed markdown file
function createMockParsedFile(
	filePath: string,
	contentRoot: ContentRoot,
	content: string = "# Test",
): ParsedMarkdownFile {
	return {
		filePath,
		absolutePath: filePath,
		contentRoot,
		ast: {
			type: "root",
			children: [
				{
					type: "heading",
					depth: 1,
					children: [{ type: "text", value: "Test", position: undefined }],
					position: undefined,
				},
			],
			position: undefined,
		},
		content,
	};
}

describe("repository options", () => {
	describe("getTocOption", () => {
		it("should return the content root's default toc option when not overridden", async () => {
			// Arrange
			const contentRoot = createMockContentRoot({ toc: true });
			const parsedFile = createMockParsedFile("/test/file.md", contentRoot);
			const state = createRepositoryState([parsedFile], [contentRoot]);
			const stateWithFrontmatter = await processFrontmatter(state);

			// Act
			const tocOption = getTocOption(stateWithFrontmatter, "/test/file.md");

			// Assert
			expect(tocOption).toBe(true);
		});

		it("should return the frontmatter toc option when overridden", () => {
			// Arrange
			const contentRoot = createMockContentRoot({ toc: true });
			const parsedFile = createMockParsedFile("/test/file.md", contentRoot);
			const state = createRepositoryState([parsedFile], [contentRoot]);

			// Mock the frontmatter
			const stateWithFrontmatter = {
				...state,
				frontmatter: new Map([["/test/file.md", { toc: false }]]),
				frontmatterValidationIssues: new Map(),
			};

			// Act
			const tocOption = getTocOption(stateWithFrontmatter, "/test/file.md");

			// Assert
			expect(tocOption).toBe(false);
		});

		it("should return false for a non-existent document", async () => {
			// Arrange
			const contentRoot = createMockContentRoot({ toc: true });
			const parsedFile = createMockParsedFile("/test/file.md", contentRoot);
			const state = createRepositoryState([parsedFile], [contentRoot]);
			const stateWithFrontmatter = await processFrontmatter(state);

			// Act
			const tocOption = getTocOption(stateWithFrontmatter, "/test/nonexistent.md");

			// Assert
			expect(tocOption).toBe(false);
		});
	});

	describe("getRelatedPagesOption", () => {
		it("should return the content root's default related pages option when not overridden", async () => {
			// Arrange
			const contentRoot = createMockContentRoot({
				relatedPages: {
					name: "Custom Related Pages",
					max: 10,
				},
			});
			const parsedFile = createMockParsedFile("/test/file.md", contentRoot);
			const state = createRepositoryState([parsedFile], [contentRoot]);
			const stateWithFrontmatter = await processFrontmatter(state);

			// Act
			const relatedPagesOption = getRelatedPagesOption(
				stateWithFrontmatter,
				"/test/file.md",
			);

			// Assert
			expect(relatedPagesOption).toEqual({
				enabled: true,
				name: "Custom Related Pages",
				max: 10,
			});
		});

		it("should return the frontmatter related pages option when overridden", () => {
			// Arrange
			const contentRoot = createMockContentRoot({
				relatedPages: {
					name: "Default Related Pages",
					max: 5,
				},
			});
			const parsedFile = createMockParsedFile("/test/file.md", contentRoot);
			const state = createRepositoryState([parsedFile], [contentRoot]);

			// Mock the frontmatter
			const stateWithFrontmatter = {
				...state,
				frontmatter: new Map([
					[
						"/test/file.md",
						{
							related_pages: true,
							related_pages_name: "Custom Name",
							related_pages_max: 3,
						},
					],
				]),
				frontmatterValidationIssues: new Map(),
			};

			// Act
			const relatedPagesOption = getRelatedPagesOption(
				stateWithFrontmatter,
				"/test/file.md",
			);

			// Assert
			expect(relatedPagesOption).toEqual({
				enabled: true,
				name: "Custom Name",
				max: 3,
			});
		});

		it("should handle partial overrides in frontmatter", () => {
			// Arrange
			const contentRoot = createMockContentRoot({
				relatedPages: {
					name: "Default Related Pages",
					max: 5,
				},
			});
			const parsedFile = createMockParsedFile("/test/file.md", contentRoot);
			const state = createRepositoryState([parsedFile], [contentRoot]);

			// Mock the frontmatter with only some properties overridden
			const stateWithFrontmatter = {
				...state,
				frontmatter: new Map([
					[
						"/test/file.md",
						{
							related_pages_name: "Custom Name",
						},
					],
				]),
				frontmatterValidationIssues: new Map(),
			};

			// Act
			const relatedPagesOption = getRelatedPagesOption(
				stateWithFrontmatter,
				"/test/file.md",
			);

			// Assert
			expect(relatedPagesOption).toEqual({
				enabled: true,
				name: "Custom Name",
				max: 5, // Default value not overridden
			});
		});

		it("should handle boolean relatedPages config", async () => {
			// Arrange
			const contentRoot = createMockContentRoot({
				relatedPages: false,
			});
			const parsedFile = createMockParsedFile("/test/file.md", contentRoot);
			const state = createRepositoryState([parsedFile], [contentRoot]);
			const stateWithFrontmatter = await processFrontmatter(state);

			// Act
			const relatedPagesOption = getRelatedPagesOption(
				stateWithFrontmatter,
				"/test/file.md",
			);

			// Assert
			expect(relatedPagesOption).toEqual({
				enabled: false,
				name: "Related pages",
				max: 5,
			});
		});
	});

	describe("getFileOptions", () => {
		it("should return all file options", () => {
			// Arrange
			const contentRoot = createMockContentRoot({
				toc: true,
				relatedPages: {
					name: "Related Pages",
					max: 5,
				},
			});
			const parsedFile = createMockParsedFile("/test/file.md", contentRoot);
			const state = createRepositoryState([parsedFile], [contentRoot]);

			// Mock the frontmatter
			const stateWithFrontmatter = {
				...state,
				frontmatter: new Map([
					[
						"/test/file.md",
						{
							toc: false,
							related_pages_name: "Custom Name",
						},
					],
				]),
				frontmatterValidationIssues: new Map(),
			};

			// Act
			const fileOptions = getFileOptions(stateWithFrontmatter, "/test/file.md");

			// Assert
			expect(fileOptions).toEqual({
				toc: false,
				relatedPages: {
					enabled: true,
					name: "Custom Name",
					max: 5,
				},
			});
		});
	});
});
