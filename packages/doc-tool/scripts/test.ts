import { defineDocumentationConfig } from "../src/index.js";

await defineDocumentationConfig({
	contentRoots: [
		{
			path: "./docs",
		},
	],
});
