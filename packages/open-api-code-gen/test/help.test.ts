import { beforeEach, expect, test } from "vitest";
import { ensureEmptyTestDir, testOnStdout } from "./util.js";

beforeEach(ensureEmptyTestDir);

test("should output help information", async () => {
	const { stdout, stderr } = await testOnStdout({
		contents: `defineOpenApiCodeGen({});`,
		args: ["--help"],
	});

	expect({ stdout, stderr }).toMatchInlineSnapshot(`
		{
		  "stderr": "",
		  "stdout": "[start] Running @lightbase/open-api-code-gen for 'test-generate.ts'.
		[log] Usage: npx tsx test-generate.ts [...flags]

		Code generation based on OpenAPI specifications.

		Flags:
		  --help               Prints this help output
		  --resolve-types      Write a file to the .cache directory to get started.
		                       This improves Typescript auto-completions for various configuration
		                       options based on your OpenAPI specifications.

		Check the docs for more information at https://github.com/lightbasenl/platforms/tree/main/packages/open-api-code-gen
				
		",
		}
	`);
});
