/**
 * Detect if defineDocumentationConfig is called directly from the entrypoint or called as a
 * library.
 * In the first case we try to pretty-print errors and exit. In the latter, we just throw them.
 */
export function isCalledFromEntrypoint(argv: Array<string> = process.argv): boolean {
	const error = new Error();

	// Error
	//    at isCalledFromEntrypoint
	//    	(/Users/.../packages/doc-tool/src/config/entrypoint.ts:2:16)
	//    at defineDocumentationConfig
	//    	(/Users/.../packages/doc-tool/src/config/define.ts:15:23)
	//    at <anonymous>
	//    	(/Users/.../some/scripts/test.ts:3:1)
	const stackTrace = error.stack || "";
	const stackLines = stackTrace.split("\n");

	const thirdLine = stackLines[3]?.trim();
	const secondLine = stackLines[2]?.trim();

	// Check if the third line matches the entry point (i.e., `process.argv[1]`).
	const isEntrypoint =
		thirdLine?.includes(argv[1] || "") &&
		secondLine?.includes("defineDocumentationConfig");

	return isEntrypoint || false;
}
