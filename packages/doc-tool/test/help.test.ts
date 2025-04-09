import { beforeEach, expect, test } from "vitest";
import { ensureEmptyTestDir, testOnStdout } from "./util.js";

beforeEach(ensureEmptyTestDir);

test("should output help information", async () => {
	const { stdout, stderr } = await testOnStdout({
		contents: `defineDocumentationConfig({ contentRoots: [] });`,
		args: ["--help"],
	});

	expect({ stdout, stderr }).toMatchInlineSnapshot(`
		{
		  "stderr": "",
		  "stdout": "[log] 
		Usage: [36mnode test-generate.ts [...options][39m

		A CLI tool for maintaining and improving Markdown-based project and process documentation
		with support for TOC generation, link checking, glossary suggestions, and more.

		Commands:
		  [36mnode test-generate.ts[39m
		    Run basic checks on all files in the configured content roots.

		  [36mnode test-generate.ts suggest [glob][39m
		    Suggest changes to files based on the configured content roots.
		    Pass in a glob to only suggest changes to the full contents of files matching the glob.

		Flags:
		  --help               Prints this help output.
		  --github-token       Integrate with GitHub to create comments on PRs.

		Check the docs for more information at https://github.com/lightbasenl/platforms/tree/main/packages/doc-tool
				
		",
		}
	`);
});
