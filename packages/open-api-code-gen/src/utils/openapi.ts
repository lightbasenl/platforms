import { OpenAPIV3 } from "openapi-types";
import { isNil } from "./assert.js";

export type PathItem = {
	document: OpenAPIV3.Document;
	path: string;
	method: string;
	pathItem: OpenAPIV3.OperationObject;
};

export function resolvePathItems(
	specifications: Array<OpenAPIV3.Document>,
): Array<PathItem> {
	const methods = Object.values(OpenAPIV3.HttpMethods);

	return specifications
		.flatMap((document) =>
			Object.keys(document.paths).flatMap((path) =>
				methods.map((method) => {
					if (!isNil(document.paths[path]?.[method])) {
						return {
							document,
							path,
							method,
							pathItem: document.paths[path][method],
						};
					}
				}),
			),
		)
		.filter((it) => !!it);
}

export function resolveReference<T>(
	ref: string,
	specification: OpenAPIV3.Document,
): T | undefined {
	if (!ref.startsWith("#")) {
		throw new Error(`Invalid reference '${ref}'.
The loader couldn't resolve this reference. Does the referenced file or resource exist?`);
	}

	ref = ref.slice(1);
	const refParts = ref.split("/").filter((it) => !!it);
	let currentObj: Record<string, unknown> = specification as unknown as Record<
		string,
		unknown
	>;
	while (refParts.length) {
		const part = refParts.shift();
		if (!part) {
			throw new Error(`Couldn't resolve '${part}' from '#/${ref}'.`);
		}

		currentObj = currentObj[part] as Record<string, unknown>;
		if (!currentObj) {
			return undefined;
		}
	}

	return currentObj as T;
}
