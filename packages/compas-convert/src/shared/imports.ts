import type { SourceFile } from "ts-morph";
import type { Context } from "../context.js";

/**
 * Prevent intermediate writes by queuing imports. These will be added later.
 */
export function addPendingImport(
	context: Context,
	sourceFile: SourceFile,
	moduleName: string,
	symbolName: string,
	typeOnly: boolean,
) {
	const filename = sourceFile.getFilePath();
	context.pendingImports[filename] ??= [];
	context.pendingImports[filename].push({
		moduleName,
		symbolName,
		typeOnly,
	});
}

export function addNamedImportIfNotExists(
	file: SourceFile,
	moduleName: string,
	symbolName: string,
	typeOnly: boolean,
) {
	const existingImports = file
		.getImportDeclarations()
		.filter(
			(decl) =>
				decl.getModuleSpecifierValue() === moduleName &&
				decl.getNamedImports().length > 0,
		);

	if (existingImports.length === 0) {
		file.addImportDeclaration({
			moduleSpecifier: moduleName,
			isTypeOnly: typeOnly,
			namedImports: [
				{
					name: symbolName,
				},
			],
		});

		return;
	}

	const hasName = existingImports.some((it) =>
		it.getNamedImports().some((it) => it.getName() === symbolName),
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
			moduleSpecifier: moduleName,
			isTypeOnly: typeOnly,
			namedImports: [
				{
					name: symbolName,
				},
			],
		});
		return;
	}

	typeOrValueMatchedImport.addNamedImport({
		name: symbolName,
	});
}
