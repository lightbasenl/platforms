import fs from "node:fs/promises";
import path from "node:path";
import consola from "consola";
import type { Text } from "mdast";
import { describe, expect, it, beforeEach, vi } from "vitest";
import type { ContentRoot } from "../../src/config/validate.js";
import { FileParsingError } from "../../src/error.js";
import {
	findMarkdownFiles,
	parseMarkdownFile,
	findAndParseMarkdownFiles,
} from "../../src/markdown/parser.js";
import { ensureEmptyTestDir, tmpDir } from "../util.js";

// Helper function to create ContentRoot objects from paths
function createContentRoot(path: string): ContentRoot {
	return {
		path,
		baseUrl: "/",
		shareGlossary: true,
		toc: true,
		validateFrontmatter: {
			"~standard": {
				vendor: "mock",
				version: 1,
				validate: () => {
					return {
						issues: [],
					};
				},
			},
		},
		relatedPages: {
			name: "Related pages",
			max: 5,
		},
	};
}

describe("markdown parser", () => {
	beforeEach(async () => {
		const cleanup = await ensureEmptyTestDir();
		// Mock consola.error to prevent test output pollution
		vi.spyOn(consola, "error").mockImplementation(() => {});

		return () => {
			vi.restoreAllMocks();
			return cleanup();
		};
	});

	describe("findMarkdownFiles", () => {
		it("should find markdown files in a single content root", async () => {
			// Create test files
			const testDir = path.join(tmpDir, "test-content");
			await fs.mkdir(testDir, { recursive: true });
			await fs.writeFile(path.join(testDir, "file1.md"), "# Test File 1");
			await fs.writeFile(path.join(testDir, "file2.md"), "# Test File 2");
			await fs.writeFile(path.join(testDir, "not-markdown.txt"), "Not a markdown file");

			// Create a subdirectory with more files
			const subDir = path.join(testDir, "subdir");
			await fs.mkdir(subDir, { recursive: true });
			await fs.writeFile(path.join(subDir, "file3.md"), "# Test File 3");

			// Find markdown files
			const files = findMarkdownFiles([createContentRoot(testDir)]);

			// Verify results
			expect(files).toHaveLength(3);
			expect(files.map((f) => path.basename(f.filePath))).toContain("file1.md");
			expect(files.map((f) => path.basename(f.filePath))).toContain("file2.md");
			expect(files.map((f) => path.basename(f.filePath))).toContain("file3.md");
			expect(files.map((f) => path.basename(f.filePath))).not.toContain(
				"not-markdown.txt",
			);
		});

		it("should find markdown files in multiple content roots", async () => {
			// Create test files in the first content root
			const testDir1 = path.join(tmpDir, "test-content-1");
			await fs.mkdir(testDir1, { recursive: true });
			await fs.writeFile(path.join(testDir1, "file1.md"), "# Test File 1");

			// Create test files in second content root
			const testDir2 = path.join(tmpDir, "test-content-2");
			await fs.mkdir(testDir2, { recursive: true });
			await fs.writeFile(path.join(testDir2, "file2.md"), "# Test File 2");

			// Find markdown files
			const files = findMarkdownFiles([
				createContentRoot(testDir1),
				createContentRoot(testDir2),
			]);

			// Verify results
			expect(files).toHaveLength(2);

			expect(files.map((f) => path.basename(f.filePath))).toContain("file1.md");
			expect(files.map((f) => path.basename(f.filePath))).toContain("file2.md");
		});

		it("should ignore files in node_modules and dist directories", async () => {
			// Create test files
			const testDir = path.join(tmpDir, "test-content");
			await fs.mkdir(testDir, { recursive: true });
			await fs.writeFile(path.join(testDir, "file1.md"), "# Test File 1");

			// Create node_modules directory with markdown file
			const nodeModulesDir = path.join(testDir, "node_modules");
			await fs.mkdir(nodeModulesDir, { recursive: true });
			await fs.writeFile(path.join(nodeModulesDir, "ignored.md"), "# Ignored File");

			// Create dist directory with markdown file
			const distDir = path.join(testDir, "dist");
			await fs.mkdir(distDir, { recursive: true });
			await fs.writeFile(path.join(distDir, "ignored.md"), "# Ignored File");

			// Find markdown files
			const files = findMarkdownFiles([createContentRoot(testDir)]);

			// Verify results
			expect(files).toHaveLength(1);
			expect(files.map((f) => path.basename(f.filePath))).toContain("file1.md");
			expect(files.map((f) => path.basename(f.filePath))).not.toContain("ignored.md");
		});
	});

	describe("parseMarkdownFile", () => {
		it("should parse a markdown file correctly", async () => {
			// Create test file
			const testDir = path.join(tmpDir, "test-content");
			await fs.mkdir(testDir, { recursive: true });
			const filePath = path.join(testDir, "test.md");
			const content = "# Test Heading\n\nThis is a paragraph.";
			await fs.writeFile(filePath, content);

			// Create content root
			const contentRoot = createContentRoot(testDir);

			// Parse the file
			const parsedFile = await parseMarkdownFile(filePath, contentRoot);

			// Verify results
			expect(parsedFile.filePath).toBe(filePath);
			expect(parsedFile.contentRoot).toBe(contentRoot);
			expect(parsedFile.content).toBe(content);
			expect(parsedFile.ast).toBeDefined();
			expect(parsedFile.ast.type).toBe("root");

			// Check that the AST contains the expected heading
			const heading = parsedFile.ast.children.find((node) => node.type === "heading");
			expect(heading).toBeDefined();
			expect(heading?.depth).toBe(1);
			expect((heading?.children[0] as Text).value).toBe("Test Heading");
		});

		it("should parse markdown with various features including GFM syntax", async () => {
			// Create test file with various markdown features
			const testDir = path.join(tmpDir, "test-content");
			await fs.mkdir(testDir, { recursive: true });
			const filePath = path.join(testDir, "complex.md");

			const content = `# Heading 1
## Heading 2

This is a paragraph with **bold** and *italic* text.

- List item 1
- List item 2
  - Nested item

1. Ordered item 1
2. Ordered item 2

> This is a blockquote

\`\`\`typescript
// This is a code block
const x = 1;
\`\`\`

[Link text](https://example.com)

<!-- GFM specific syntax below -->

## Table
| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |

## Task Lists
- [x] Completed task
- [ ] Incomplete task

## Strikethrough
This is ~~strikethrough~~ text.

## Autolinks
Visit https://example.com for more information.

## Footnotes
Here is a footnote reference[^1].

[^1]: This is the footnote content.
`;
			await fs.writeFile(filePath, content);

			// Create content root
			const contentRoot = createContentRoot(testDir);

			// Parse the file
			const parsedFile = await parseMarkdownFile(filePath, contentRoot);

			// Verify results
			expect(parsedFile.filePath).toBe(filePath);
			expect(parsedFile.content).toBe(content);
			expect(parsedFile.ast).toBeDefined();

			// Check that the AST contains various elements
			const nodeTypes = parsedFile.ast.children.map((node) => node.type);
			expect(nodeTypes).toContain("heading");
			expect(nodeTypes).toContain("paragraph");
			expect(nodeTypes).toContain("list");
			expect(nodeTypes).toContain("blockquote");
			expect(nodeTypes).toContain("code");

			// Check for GFM specific elements
			expect(nodeTypes).toContain("table");

			// Find task list items
			const listItems = parsedFile.ast.children.flatMap((node) =>
				node.type === "list" ? node.children : [],
			);
			// In GFM, task list items have a `checked` property
			const taskListItems = listItems.filter((item) => "checked" in item);
			expect(taskListItems.length).toBeGreaterThan(0);

			// Find strikethrough text
			const paragraphs = parsedFile.ast.children.filter(
				(node) => node.type === "paragraph",
			);
			const hasStrikethrough = paragraphs.some((p) =>
				p.children.some((child) => child.type === "delete"),
			);
			expect(hasStrikethrough).toBe(true);

			// Check for footnote definitions
			expect(nodeTypes).toContain("footnoteDefinition");
		});
	});

	describe("findAndParseMarkdownFiles", () => {
		it("should find and parse markdown files from multiple content roots", async () => {
			// Create test files in first content root
			const testDir1 = path.join(tmpDir, "test-content-1");
			await fs.mkdir(testDir1, { recursive: true });
			await fs.writeFile(path.join(testDir1, "file1.md"), "# Test File 1");

			// Create test files in second content root
			const testDir2 = path.join(tmpDir, "test-content-2");
			await fs.mkdir(testDir2, { recursive: true });
			await fs.writeFile(path.join(testDir2, "file2.md"), "# Test File 2");

			// Create content roots
			const contentRoot1 = createContentRoot(testDir1);
			const contentRoot2 = createContentRoot(testDir2);

			// Find and parse markdown files
			const parsedFiles = await findAndParseMarkdownFiles([contentRoot1, contentRoot2]);

			// Verify results
			expect(parsedFiles).toHaveLength(2);

			// Check that files from both content roots were parsed
			const contentRoots = parsedFiles.map((file) => file.contentRoot.path);
			expect(contentRoots).toContain(testDir1);
			expect(contentRoots).toContain(testDir2);

			// Check that ASTs were created
			expect(parsedFiles[0]!.ast).toBeDefined();
			expect(parsedFiles[1]!.ast).toBeDefined();
		});

		it("should throw FileParsingError when parsing invalid files", async () => {
			// Create a valid markdown file
			const testDir = path.join(tmpDir, "test-content");
			await fs.mkdir(testDir, { recursive: true });
			await fs.writeFile(path.join(testDir, "valid.md"), "# Valid File");

			// Create a directory with the .md extension to cause an error when trying to read it
			const invalidPath = path.join(testDir, "invalid.md");
			await fs.mkdir(invalidPath, { recursive: true });

			// Mock fs.readFile to throw an error for the invalid file
			const originalReadFile = fs.readFile;
			vi.spyOn(fs, "readFile").mockImplementation(async (path, options) => {
				if (path === invalidPath) {
					throw new Error("Test error: Cannot read directory as file");
				}
				return originalReadFile(path, options);
			});

			// Create content root
			const contentRoot = createContentRoot(testDir);

			// Expect findAndParseMarkdownFiles to throw a FileParsingError
			try {
				await findAndParseMarkdownFiles([contentRoot]);
				// If we get here, the test should fail because an error should have been thrown
				expect.fail("Expected findAndParseMarkdownFiles to throw a FileParsingError");
			} catch (error) {
				expect(error).toBeInstanceOf(FileParsingError);
				if (!(error instanceof FileParsingError)) {
					throw error;
				}

				// Verify that the error is a FileParsingError with the correct properties
				expect(error.filePath).toBe(invalidPath);
				expect(error.cause).toEqual(
					expect.objectContaining({
						message: "Test error: Cannot read directory as file",
					}),
				);
			}
		});
	});
});
