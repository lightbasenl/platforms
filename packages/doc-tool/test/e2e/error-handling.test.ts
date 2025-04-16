import { beforeEach, describe, expect, test } from "vitest";
import { ensureEmptyTestDir, testOnStdout } from "../util.js";

beforeEach(ensureEmptyTestDir);

describe("e2e - error handling", () => {
	test("should handle invalid config gracefully", async () => {
		const { stderr, exitCode } = await testOnStdout({
			contents: `
        defineDocumentationConfig({
          contentRoots: [{ path: "docs2" }]
        });
        `,
			files: [
				{
					path: "docs/readme.md",
					contents: "# Test Document",
				},
			],
		});

		expect(exitCode).not.toBe(0);
		expect(stderr).toMatch(/Content root 'docs2' does not/i);
	});
});
