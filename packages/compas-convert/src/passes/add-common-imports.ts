import type { SourceFile } from "ts-morph";
import { addPendingImport, resolveRelativeImport } from "../shared/imports.js";
import type { Context } from "./../context.js";
import { CONVERT_UTIL, CONVERT_UTIL_PATH } from "./init-ts-morph.js";

/**
 * Adds common imports to all source files.
 *
 * Any extra import that is unused after all transformations will be cleaned up the ESLint
 * setup.
 */
export function addCommonImports(context: Context, sourceFile: SourceFile) {
	// Don't add imports to the convert file
	if (sourceFile.getFilePath().endsWith("src/compas-convert.ts")) {
		return;
	}

	addPendingImport(
		context,
		sourceFile,
		resolveRelativeImport(context, sourceFile, CONVERT_UTIL_PATH),
		CONVERT_UTIL.any,
		true,
	);
	addPendingImport(
		context,
		sourceFile,
		"@lightbase/utils",
		CONVERT_UTIL.assertNotNil,
		false,
	);
	addPendingImport(
		context,
		sourceFile,
		resolveRelativeImport(context, sourceFile, CONVERT_UTIL_PATH),
		CONVERT_UTIL.assertIsAppError,
		false,
	);

	addPendingImport(context, sourceFile, "@compas/stdlib", "InsightEvent", true);
	addPendingImport(context, sourceFile, "@compas/stdlib", "Logger", true);
	addPendingImport(context, sourceFile, "@compas/stdlib", "AppError", false);
	addPendingImport(context, sourceFile, "@compas/stdlib", "Either", true);
	addPendingImport(context, sourceFile, "@compas/stdlib", "EitherN", true);

	addPendingImport(context, sourceFile, "@compas/code-gen", "Generator", false);
	addPendingImport(context, sourceFile, "@compas/code-gen", "TypeCreator", false);
	addPendingImport(context, sourceFile, "@compas/code-gen", "RouteCreator", true);
	addPendingImport(context, sourceFile, "@compas/code-gen", "TypeBuilder", true);
	addPendingImport(context, sourceFile, "@compas/code-gen", "TypeBuilderLike", true);

	addPendingImport(context, sourceFile, "@compas/server", "Application", true);
	addPendingImport(context, sourceFile, "@compas/server", "Next", true);
	addPendingImport(context, sourceFile, "@compas/server", "Middleware", true);
	addPendingImport(context, sourceFile, "@compas/server", "Context", true);
	addPendingImport(context, sourceFile, "@compas/server", "Context", true);

	addPendingImport(context, sourceFile, "@compas/store", "Postgres", true);
	addPendingImport(context, sourceFile, "@compas/store", "S3Client", true);
	addPendingImport(context, sourceFile, "@compas/store", "QueryPart", true);
	addPendingImport(context, sourceFile, "@compas/store", "SessionStoreSettings", true);
	addPendingImport(
		context,
		sourceFile,
		"@compas/store",
		"SessionTransportSettings",
		true,
	);

	addPendingImport(context, sourceFile, "axios", "AxiosInstance", true);
	addPendingImport(context, sourceFile, "axios", "AxiosRequestConfig", true);
	addPendingImport(context, sourceFile, "axios", "AxiosError", true);

	if (sourceFile.getFilePath().endsWith(".test.ts")) {
		// re-add import for newTestEvent
		addPendingImport(context, sourceFile, "@compas/cli", "newTestEvent", false);
		addPendingImport(context, sourceFile, "@compas/stdlib", "newLogger", false);
		addPendingImport(context, sourceFile, "vitest", "expect", false);
		addPendingImport(context, sourceFile, "vitest", "beforeAll", false);
		addPendingImport(context, sourceFile, "vitest", "describe", false);
		addPendingImport(context, sourceFile, "vitest", "test", false);
	}
}
