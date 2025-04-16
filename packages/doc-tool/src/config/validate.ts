import fs from "node:fs";
import { isRecord, isRecordWith } from "@lightbase/utils";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { ConfigValidationError } from "../error.js";

export type DocToolCliAndEnvOptions = {
	command: "help" | "check" | "suggest";

	suggestOnGlob?: string;

	githubToken?: string;

	reporter: "interactive" | "non-interactive" | "github";
};

export interface DocToolConfig extends DocToolCliAndEnvOptions {
	contentRoots: Array<ContentRoot>;
}

export type ContentRoot = {
	/**
	 * Relative path to the documentation directory.
	 */
	path: string;

	/**
	 * Relative path when the docs are hosted on a subpath, e.g `/docs`.
	 *
	 * When linking across multiple content roots hosted on different domains,
	 * also include the fully qualified URI e.g 'https://example.com/docs'.
	 *
	 * @default '/'
	 */
	baseUrl: string;

	/**
	 * Share glossary terms between different content roots.
	 *
	 * @default true
	 */
	shareGlossary: boolean;

	/**
	 * Add custom frontmatter validation using any validation library that supports
	 * StandardSchema. Note that you validation library should support ignoring the Doc-tool
	 * specific keys:
	 *
	 * - toc: boolean
	 * - related_pages: boolean;
	 * - related_pages_name: string;
	 * - related_pages_max: number;
	 *
	 * @link [Standard
	 *   Schema](https://github.com/standard-schema/standard-schema?tab=readme-ov-file#what-schema-libraries-implement-the-spec)
	 */
	validateFrontmatter: StandardSchemaV1;

	/**
	 * Toggle Table of Contents generation. Can be overwritten per file via Frontmatter using the
	 * `toc` property.
	 *
	 * @default true
	 */
	toc: boolean;

	/**
	 * Customize Related pages section generation.
	 *
	 * Can be customized per page using the following properties:
	 *
	 * ```
	 * related_pages: true
	 * related_pages_name: "See also"
	 * related_pages_max: 3
	 * ```
	 *
	 * @default { name: "Related pages", max: 5 }
	 */
	relatedPages?: boolean | { name?: string; max?: number };
};

type ContentRootInput = Partial<ContentRoot> & {
	path: string;
};

export type DocumentationConfigInput = {
	contentRoots: Array<ContentRootInput>;
};

/**
 * Validate the config. Assume the config is unknown, since theoretically the user doesn't
 * have to type-check.
 */
export function validateDocRootConfig(
	config: unknown,
	baseConfig: DocToolCliAndEnvOptions,
): DocToolConfig {
	if (!isRecordWith(config, ["contentRoots"])) {
		throw new ConfigValidationError("Missing 'contentRoots' property.");
	}

	if (!Array.isArray(config.contentRoots)) {
		throw new ConfigValidationError("'contentRoots' property must be an array.");
	}

	const result: DocToolConfig = {
		...baseConfig,
		contentRoots: [],
	};

	for (let i = 0; i < config.contentRoots.length; i++) {
		const contentRoot: unknown = config.contentRoots[i];

		const validatedContentRoot = validateContentRootConfig(contentRoot, i);
		validateContentRootDetails(validatedContentRoot);

		result.contentRoots.push(validatedContentRoot);
	}

	return result;
}

/**
 * Validate the content roots structurally, applying the defaults.
 * Semantic validation still has to happen.
 */
export function validateContentRootConfig(
	contentRoot: unknown,
	contentRootIndex: number,
) {
	if (!isRecordWith(contentRoot, ["path"])) {
		throw new ConfigValidationError(
			`contentRoots[${contentRootIndex}]: Missing 'path' property.`,
		);
	}

	if (typeof contentRoot.path !== "string") {
		throw new ConfigValidationError(
			`contentRoots[${contentRootIndex}]: 'path' property must be a string.`,
		);
	}

	const result: ContentRoot = {
		path: contentRoot.path,
		baseUrl: "/",
		shareGlossary: true,
		toc: true,
		validateFrontmatter: {
			"~standard": {
				vendor: "mock",
				version: 1,
				validate: () => {
					return {
						issues: [],
					};
				},
			},
		},
		relatedPages: {
			name: "Related pages",
			max: 5,
		},
	};

	if (isRecordWith(contentRoot, ["baseUrl"])) {
		if (typeof contentRoot.baseUrl !== "string") {
			throw new ConfigValidationError(
				`contentRoots[${contentRootIndex}]: 'baseUrl' property must be a string.`,
			);
		}

		result.baseUrl = contentRoot.baseUrl;
	}

	if (isRecordWith(contentRoot, ["shareGlossary"])) {
		if (typeof contentRoot.shareGlossary !== "boolean") {
			throw new ConfigValidationError(
				`contentRoots[${contentRootIndex}]: 'shareGlossary' property must be a boolean.`,
			);
		}

		result.shareGlossary = contentRoot.shareGlossary;
	}

	if (isRecordWith(contentRoot, ["toc"])) {
		if (typeof contentRoot.toc !== "boolean") {
			throw new ConfigValidationError(
				`contentRoots[${contentRootIndex}]: 'toc' property must be a boolean.`,
			);
		}
		result.toc = contentRoot.toc;
	}

	if (isRecordWith(contentRoot, ["relatedPages"])) {
		if (typeof contentRoot.relatedPages === "boolean") {
			if (!contentRoot.relatedPages) {
				result.relatedPages = false;
			}
		} else if (isRecord(contentRoot.relatedPages)) {
			const relatedPagesResult = { name: "Related pages", max: 5 };

			const relatedPages = contentRoot.relatedPages;
			if (isRecordWith(relatedPages, ["name"])) {
				if (typeof relatedPages.name !== "string") {
					throw new ConfigValidationError(
						`contentRoots[${contentRootIndex}]: 'relatedPages.name' property must be a string.`,
					);
				}
				relatedPagesResult.name = relatedPages.name;
			}

			if (isRecordWith(relatedPages, ["max"])) {
				if (typeof relatedPages.max !== "number") {
					throw new ConfigValidationError(
						`contentRoots[${contentRootIndex}]: 'relatedPages.max' property must be a number.`,
					);
				}
				relatedPagesResult.max = relatedPages.max;
			}

			result.relatedPages = relatedPagesResult;
		} else {
			throw new ConfigValidationError(
				`contentRoots[${contentRootIndex}]: 'relatedPages' property must be a boolean or an object.`,
			);
		}
	}

	if (isRecordWith(contentRoot, ["validateFrontmatter"])) {
		if (!isRecordWith(contentRoot.validateFrontmatter, ["~standard"])) {
			throw new ConfigValidationError(
				`contentRoots[${contentRootIndex}]: 'validateFrontmatter' property must be an object with the '~standard' key.`,
			);
		}

		result.validateFrontmatter = contentRoot.validateFrontmatter as StandardSchemaV1;
	}

	return result;
}

/**
 * Check if the content root exists and do some config input cleanup.
 */
export function validateContentRootDetails(contentRoot: ContentRoot) {
	if (!fs.existsSync(contentRoot.path)) {
		throw new ConfigValidationError(`Content root '${contentRoot.path}' does not exist.`);
	}

	if (!contentRoot.baseUrl.endsWith("/")) {
		contentRoot.baseUrl += "/";
	}
}
