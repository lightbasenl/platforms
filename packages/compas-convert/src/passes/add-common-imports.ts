import path from "node:path";
import type { SourceFile } from "ts-morph";
import { Node } from "ts-morph";
import type { Context } from "./../context.js";
import { CONVERT_UTIL, CONVERT_UTIL_PATH } from "./init-ts-morph.js";

/**
 * Adds common imports to all source files.
 *
 * Any extra import that is unused after all transformations will be cleaned up the ESLint setup.
 */
export function addCommonImports(context: Context, sourceFile: SourceFile) {
	addNamedImportIfNotExists(
		sourceFile,
		resolveRelativeImport(context, sourceFile, CONVERT_UTIL_PATH),
		CONVERT_UTIL.any,
		true,
	);

	addNamedImportIfNotExists(sourceFile, "@compas/stdlib", "InsightEvent", true);
	addNamedImportIfNotExists(sourceFile, "@compas/stdlib", "Logger", true);
	addNamedImportIfNotExists(sourceFile, "@compas/stdlib", "AppError", false);
	addNamedImportIfNotExists(sourceFile, "@compas/stdlib", "Either", true);
	addNamedImportIfNotExists(sourceFile, "@compas/stdlib", "EitherN", true);

	addNamedImportIfNotExists(sourceFile, "@compas/code-gen", "Generator", false);
	addNamedImportIfNotExists(sourceFile, "@compas/code-gen", "TypeCreator", false);
	addNamedImportIfNotExists(sourceFile, "@compas/code-gen", "RouteCreator", true);
	addNamedImportIfNotExists(sourceFile, "@compas/code-gen", "TypeBuilder", true);
	addNamedImportIfNotExists(sourceFile, "@compas/code-gen", "TypeBuilderLike", true);

	addNamedImportIfNotExists(sourceFile, "@compas/server", "Application", true);
	addNamedImportIfNotExists(sourceFile, "@compas/server", "Next", true);
	addNamedImportIfNotExists(sourceFile, "@compas/server", "Middleware", true);
	addNamedImportIfNotExists(sourceFile, "@compas/server", "Context", true);

	addNamedImportIfNotExists(sourceFile, "@compas/store", "Postgres", true);
	addNamedImportIfNotExists(sourceFile, "@compas/store", "S3Client", true);
	addNamedImportIfNotExists(sourceFile, "@compas/store", "QueryPart", true);
	addNamedImportIfNotExists(sourceFile, "@compas/store", "SessionStoreSettings", true);
	addNamedImportIfNotExists(
		sourceFile,
		"@compas/store",
		"SessionTransportSettings",
		true,
	);

	addNamedImportIfNotExists(sourceFile, "axios", "AxiosInstance", true);
	addNamedImportIfNotExists(sourceFile, "axios", "AxiosRequestConfig", true);
	addNamedImportIfNotExists(sourceFile, "axios", "AxiosError", true);
}

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
