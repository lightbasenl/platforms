import { existsSync } from "node:fs";
import path from "node:path";
import type { ConvertInputOptions, ConvertOutputOptions } from "swagger2openapi";
import { convertFile, convertUrl } from "swagger2openapi";
import { objectWithKey } from "../utils/assert.js";

type FileSource = {
	file: string;
};

type DirectorySource = {
	directory: string;
};

type RemoteSource = {
	url: string;
	fetch?: typeof fetch;
};

export type LoaderSource = FileSource | DirectorySource | RemoteSource;

/**
 * (Fetch), read, load, (convert) and (resolve) OpenAPI files.
 *
 * Supports converting from YAML and JSON. Reading from files, directories, and remote urls.
 */
export async function loadSpecificationsFromSource(
	sources: Array<LoaderSource>,
): Promise<Array<ConvertOutputOptions>> {
	return (
		await Promise.all(
			sources.map((it) => {
				const opts: Partial<ConvertInputOptions> = {
					resolve: true,
					resolveInternal: true,
				};

				if (objectWithKey(it, "file")) {
					return convertFile(it.file, opts);
				} else if (objectWithKey(it, "directory")) {
					if (existsSync(path.join(it.directory, "openapi.json"))) {
						return convertFile(path.join(it.directory, "openapi.json"), opts);
					}
					if (existsSync(path.join(it.directory, "openapi.yaml"))) {
						return convertFile(path.join(it.directory, "openapi.yaml"), opts);
					}

					if (existsSync(path.join(it.directory, "swagger.json"))) {
						return convertFile(path.join(it.directory, "swagger.json"), opts);
					}

					throw new Error(
						`Couldn't find 'openapi.json' or 'openapi.yaml' in '${it.directory}'.`,
					);
				} else if (objectWithKey(it, "url")) {
					opts.fetch = it.fetch;
					return convertUrl(it.url, opts);
				}
			}),
		)
	)
		.flat()
		.filter((it) => !!it);
}
