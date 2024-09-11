import path from "node:path";
import { Project } from "ts-morph";
import type { Node } from "ts-morph";
import type { Context } from "../context.js";

/**
 * TS-morph is a library for manipulating via the TypeScript API's.
 *
 * Some other utils:
 * - https://www.npmjs.com/package/@typescript-eslint/type-utils
 * - https://github.com/JoshuaKGoldberg/ts-api-utils/tree/main
 */
export function initTsMorph(context: Context) {
	context.ts = new Project({
		tsConfigFilePath: path.join(context.outputDirectory, "tsconfig.json"),
	});

	context.ts.createSourceFile(
		path.join(context.outputDirectory, "./src/compas-convert.ts"),
		`
// File added by compas-convert

/**
 * While migrating, not every type can be resolved or inferred. In these cases, an explicit
 * $ConvertAny is added. This solves 2 problems:
 *
 * - Left-over issues from the migration are clearly visible.
 * - Only a single place needs the no-explicit-any rule.
 *
 * Manual usage of this type is strongly discouraged.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type $ConvertAny = any;
`,
	);
}

export function getTypescriptProgram(context: Context) {
	if (!context.ts) {
		throw new Error("For some reason, ts-morph did not init.");
	}

	return context.ts;
}

export function addConvertAnyImport(context: Context, node: Node) {
	const srcFile = node.getSourceFile();
	const relativeImport = `${path
		.relative(
			srcFile.getFilePath(),
			path.join(context.outputDirectory, "./src/compas-convert.ts"),
		)
		.slice(0, -3)}.js`;

	node.getSourceFile().addImportDeclaration({
		isTypeOnly: true,
		moduleSpecifier: relativeImport,
		namedImports: [
			{
				name: "$ConvertAny",
			},
		],
	});
}
