import path from "node:path";
import { Node } from "ts-morph";
import type { SourceFile } from "ts-morph";
import type { Context } from "../context.js";

export function addNamedImportIfNotExists(
	file: SourceFile,
	module: string,
	name: string,
	typeOnly: boolean,
) {
	const existingImports = file
		.getImportDeclarations()
		.filter(
			(decl) =>
				decl.getModuleSpecifierValue() === module && decl.getNamedImports().length > 0,
		);

	if (existingImports.length === 0) {
		file.addImportDeclaration({
			moduleSpecifier: module,
			isTypeOnly: typeOnly,
			namedImports: [
				{
					name,
				},
			],
		});

		return;
	}

	const hasName = existingImports.some((it) =>
		it.getNamedImports().some((it) => it.getName() === name),
	);
	if (hasName) {
		// All existing imports are not typeOnly, but that means that we don't have to add the type
		// only import either way.
		return;
	}

	const typeOrValueMatchedImport = existingImports.find(
		(it) => it.isTypeOnly() === typeOnly,
	);

	if (!typeOrValueMatchedImport) {
		file.addImportDeclaration({
			moduleSpecifier: module,
			isTypeOnly: typeOnly,
			namedImports: [
				{
					name,
				},
			],
		});
		return;
	}

	typeOrValueMatchedImport.addNamedImport({
		name,
	});
}

/**
 * Resolve a relative import from source to target.
 */
export function resolveRelativeImport(
	context: Context,
	source: Node | SourceFile,
	target: string,
) {
	const srcFile = Node.isNode(source) ? source.getSourceFile() : source;
	const targetFile = path.join(context.outputDirectory, target);

	// Imports should include the .js extension.
	return `./${path
		.relative(
			// Relative assumes a directory as input, else we might get an extra '../'.
			srcFile.getFilePath().split("/").slice(0, -1).join("/"),
			targetFile,
		)
		.replace(".ts", ".js")}`;
}
