import type { OpenAPIV3 } from "openapi-types";

export type GlobalHooks = {
	/**
	 * Mutate the loaded document before typings are written to disk.
	 * This is the place to define missing paths or remove paths that you don't want to use.
	 */
	beforeResolveTypes?: (specification: OpenAPIV3.Document) => void;

	/**
	 * Mutate the loaded document before any generation step is being executed.
	 * This can be used to apply global fixes to the provided schema.
	 */
	beforeGenerate?: (specification: OpenAPIV3.Document) => void;
};
