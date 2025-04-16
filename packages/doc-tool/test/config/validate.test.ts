import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { vi } from "vitest";
import {
	validateDocRootConfig,
	validateContentRootConfig,
	validateContentRootDetails,
} from "../../src/config/validate.js";
import type { ContentRoot } from "../../src/config/validate.js";
import type { DocToolCliAndEnvOptions } from "../../src/config/validate.js";
import { ConfigValidationError } from "../../src/error.js";

describe("validateDocRootConfig", () => {
	const baseConfig: DocToolCliAndEnvOptions = {
		command: "check",
		reporter: "interactive",
	};

	it("should validate valid config", () => {
		const config = {
			contentRoots: [
				{
					path: "docs",
				},
			],
		};

		vi.spyOn(fs, "existsSync").mockReturnValue(true);
		expect(() => validateDocRootConfig(config, baseConfig)).not.toThrow();
	});

	it("should throw on missing contentRoots", () => {
		const config = {};
		expect(() => validateDocRootConfig(config, baseConfig)).toThrow(
			ConfigValidationError,
		);
	});

	it("should throw on non-array contentRoots", () => {
		const config = { contentRoots: "not-array" };
		expect(() => validateDocRootConfig(config, baseConfig)).toThrow(
			ConfigValidationError,
		);
	});
});

describe("validateContentRootConfig", () => {
	it("should validate minimal config and apply defaults", () => {
		const config = { path: "docs" };
		expect(validateContentRootConfig(config, 0)).toMatchObject({
			path: "docs",
			baseUrl: "/",
			shareGlossary: true,
			toc: true,
		});
	});

	it("should throw on missing path property", () => {
		const config = {};
		expect(() => validateContentRootConfig(config, 0)).toThrow(ConfigValidationError);
	});

	it("should throw on invalid path type", () => {
		const config = { path: 123 };
		expect(() => validateContentRootConfig(config, 0)).toThrow(ConfigValidationError);
	});

	it("should throw on invalid baseUrl type", () => {
		const config = {
			path: "docs",
			baseUrl: 123,
		};
		expect(() => validateContentRootConfig(config, 0)).toThrow(ConfigValidationError);
	});

	it("should throw on invalid shareGlossary type", () => {
		const config = {
			path: "docs",
			shareGlossary: "true",
		};
		expect(() => validateContentRootConfig(config, 0)).toThrow(ConfigValidationError);
	});

	it("should throw on invalid toc type", () => {
		const config = {
			path: "docs",
			toc: "true",
		};
		expect(() => validateContentRootConfig(config, 0)).toThrow(ConfigValidationError);
	});

	it("should throw on invalid relatedPages type", () => {
		const config = {
			path: "docs",
			relatedPages: "invalid",
		};
		expect(() => validateContentRootConfig(config, 0)).toThrow(ConfigValidationError);
	});

	it("should throw on invalid relatedPages.name type", () => {
		const config = {
			path: "docs",
			relatedPages: { name: 123 },
		};
		expect(() => validateContentRootConfig(config, 0)).toThrow(ConfigValidationError);
	});

	it("should throw on invalid relatedPages.max type", () => {
		const config = {
			path: "docs",
			relatedPages: { max: "5" },
		};
		expect(() => validateContentRootConfig(config, 0)).toThrow(ConfigValidationError);
	});

	it("should throw on invalid validateFrontmatter type", () => {
		const config = {
			path: "docs",
			validateFrontmatter: "invalid",
		};
		expect(() => validateContentRootConfig(config, 0)).toThrow(ConfigValidationError);
	});

	it("should throw on validateFrontmatter without ~standard key", () => {
		const config = {
			path: "docs",
			validateFrontmatter: {},
		};
		expect(() => validateContentRootConfig(config, 0)).toThrow(ConfigValidationError);
	});

	it("should validate relatedPages boolean config", () => {
		const config = {
			path: "docs",
			relatedPages: false,
		};
		expect(validateContentRootConfig(config, 0)).toMatchObject({
			path: "docs",
			relatedPages: false,
		});
	});

	it("should validate relatedPages object config", () => {
		const config = {
			path: "docs",
			relatedPages: {
				name: "Custom Name",
				max: 10,
			},
		};
		expect(validateContentRootConfig(config, 0)).toMatchObject({
			path: "docs",
			relatedPages: {
				name: "Custom Name",
				max: 10,
			},
		});
	});

	it("should validate validateFrontmatter config", () => {
		const config = {
			path: "docs",
			validateFrontmatter: {
				"~standard": {
					vendor: "test",
					version: 1,
					validate: () => ({ issues: [] }),
				},
			},
		};
		expect(validateContentRootConfig(config, 0)).toMatchObject({
			path: "docs",
			validateFrontmatter: {
				"~standard": {
					vendor: "test",
					version: 1,
				},
			},
		});
	});

	it("should validate config with all optional properties", () => {
		const config = {
			path: "docs",
			baseUrl: "/custom",
			shareGlossary: false,
			toc: false,
			relatedPages: {
				name: "See Also",
				max: 3,
			},
			validateFrontmatter: {
				"~standard": {
					vendor: "test",
					version: 1,
					validate: () => ({ issues: [] }),
				},
			},
		};
		expect(validateContentRootConfig(config, 0)).toMatchObject(config);
	});
});

describe("validateContentRootDetails", () => {
	it("should validate existing path", () => {
		vi.spyOn(fs, "existsSync").mockReturnValue(true);
		const config: ContentRoot = {
			path: "docs",
			baseUrl: "/",
			shareGlossary: true,
			toc: true,
			validateFrontmatter: {
				"~standard": {
					vendor: "mock",
					version: 1,
					validate: () => ({ issues: [] }),
				},
			},
		};
		expect(() => validateContentRootDetails(config)).not.toThrow();
	});

	it("should throw on non-existing path", () => {
		vi.spyOn(fs, "existsSync").mockReturnValue(false);
		const config: ContentRoot = {
			path: "non-existing",
			baseUrl: "/",
			shareGlossary: true,
			toc: true,
			validateFrontmatter: {
				"~standard": {
					vendor: "mock",
					version: 1,
					validate: () => ({ issues: [] }),
				},
			},
		};
		expect(() => validateContentRootDetails(config)).toThrow(ConfigValidationError);
	});
});
