import type { StandardSchemaV1 } from "@standard-schema/spec";
import { describe, expect, it } from "vitest";
import type { ContentRoot } from "../../src/config/validate.js";
import type { ParsedMarkdownFile } from "../../src/markdown/parser.js";
import { processFrontmatter } from "../../src/repository/frontmatter.js";
import {
	createRepositoryState,
	generateDocumentId,
	getAllDocuments,
	getDocumentById,
} from "../../src/repository/index.js";

// Helper function to create a mock content root
function createMockContentRoot(path: string = "/test"): ContentRoot {
	return {
		path,
		baseUrl: "/",
		shareGlossary: true,
		toc: true,
		validateFrontmatter: {
			"~standard": {
				vendor: "mock",
				version: 1,
				validate: (data: unknown): StandardSchemaV1.Result<unknown> => {
					// Simple validation that checks if title is present
					const issues = [];
					if (typeof data === "object" && data !== null) {
						if (!("title" in data)) {
							issues.push({
								message: "Missing title",
							});
						}
					}
					return { issues };
				},
			},
		},
		relatedPages: {
			name: "Related pages",
			max: 5,
		},
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

describe("repository", () => {
	describe("createRepositoryState", () => {
		it("should create a repository state with the given files and content roots", () => {
			// Arrange
			const contentRoot = createMockContentRoot();
			const parsedFile = createMockParsedFile("/test/file.md", contentRoot);

			// Act
			const state = createRepositoryState([parsedFile], [contentRoot]);

			// Assert
			expect(state.parsedFiles).toHaveLength(1);
			expect(state.contentRoots).toHaveLength(1);
			expect(state.frontmatter).toBeInstanceOf(Map);
			expect(state.frontmatterValidationIssues).toBeInstanceOf(Map);
		});
	});

	describe("generateDocumentId", () => {
		it.each(["./file.md", "/file.md", "./nested/file.md"])(
			"should generate a document ID based on the file path",
			(input) => {
				// Arrange
				const parsedFile = createMockParsedFile(input, createMockContentRoot());

				// Act
				const id = generateDocumentId(parsedFile);

				// Assert
				expect(id).toBe(input);
			},
		);
	});

	describe("getDocumentById", () => {
		it("should return the document with the given ID", () => {
			// Arrange
			const contentRoot = createMockContentRoot();
			const filePath = "/test/file.md";
			const parsedFile = createMockParsedFile(filePath, contentRoot);
			const state = createRepositoryState([parsedFile], [contentRoot]);

			// Act
			const document = getDocumentById(state, filePath);

			// Assert
			expect(document).toBe(parsedFile);
		});

		it("should return undefined if no document with the given ID exists", () => {
			// Arrange
			const contentRoot = createMockContentRoot();
			const parsedFile = createMockParsedFile("/test/file.md", contentRoot);
			const state = createRepositoryState([parsedFile], [contentRoot]);

			// Act
			const document = getDocumentById(state, "/test/nonexistent.md");

			// Assert
			expect(document).toBeUndefined();
		});
	});

	describe("getAllDocuments", () => {
		it("should return all documents in the repository", () => {
			// Arrange
			const contentRoot = createMockContentRoot();
			const parsedFile1 = createMockParsedFile("/test/file1.md", contentRoot);
			const parsedFile2 = createMockParsedFile("/test/file2.md", contentRoot);
			const state = createRepositoryState([parsedFile1, parsedFile2], [contentRoot]);

			// Act
			const documents = getAllDocuments(state);

			// Assert
			expect(documents).toHaveLength(2);
			expect(documents).toContain(parsedFile1);
			expect(documents).toContain(parsedFile2);
		});
	});

	describe("processFrontmatter", () => {
		it("should process frontmatter for all files", async () => {
			// Arrange
			const contentRoot = createMockContentRoot();
			const parsedFile = createMockParsedFile("/test/file.md", contentRoot);
			const state = createRepositoryState([parsedFile], [contentRoot]);

			// Act
			const newState = await processFrontmatter(state);

			// Assert
			expect(newState.frontmatter.size).toBe(1);
			expect(newState.frontmatter.get("/test/file.md")).toEqual({});

			// Since our mock frontmatter is empty and the validation requires a title,
			// we should have a validation issue
			expect(newState.frontmatterValidationIssues.size).toBe(1);
			expect(newState.frontmatterValidationIssues.get("/test/file.md"))
				.toMatchInlineSnapshot(`
				[
				  "{"message":"Missing title"}",
				]
			`);
		});
	});
});
