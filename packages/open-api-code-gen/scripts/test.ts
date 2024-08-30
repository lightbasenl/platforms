import { defineOpenApiCodeGen } from "../src/index.js";

defineOpenApiCodeGen({
	name: "test",
	sources: [
		{
			file: "packages/open-api-code-gen/__fixtures__/posts.json",
		},
	],
	targets: [
		{
			target: "compas-compat-web",
			outputDirectory: "./.cache/test",
		},
	],
});
