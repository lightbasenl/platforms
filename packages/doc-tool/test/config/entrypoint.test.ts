import { afterEach, describe, expect, it, vi } from "vitest";
import { isCalledFromEntrypoint } from "../../src/config/entrypoint.js";

afterEach(() => {
	vi.restoreAllMocks();
});

describe("isCalledFromEntrypoint", () => {
	it("returns true when called directly from the entrypoint", () => {
		const mockProcessArgv = ["/usr/bin/node", "/Users/.../some/scripts/test.ts"];
		const errorStub = new Error("Error");
		errorStub.stack = `Error
          at isCalledFromEntrypoint (/Users/.../packages/doc-tool/src/config/entrypoint.ts:2:16)
          at defineDocumentationConfig (/Users/.../packages/doc-tool/src/config/define.ts:15:23)
          at <anonymous> (/Users/.../some/scripts/test.ts:3:1)
    `;

		vi.spyOn(global, "Error").mockImplementation(function () {
			return errorStub;
		});

		expect(isCalledFromEntrypoint(mockProcessArgv)).toBe(true);
	});

	it("returns false when not called from the entrypoint", () => {
		const mockProcessArgv = ["/usr/bin/node", "/Users/.../different/script.js"];
		const errorStub = new Error("Error");
		errorStub.stack = `Error
          at isCalledFromEntrypoint (/Users/.../packages/doc-tool/src/config/entrypoint.ts:2:16)
          at someOtherFunction (/Users/.../packages/doc-tool/src/someFunction.ts:10:10)
          at <anonymous> (/Users/.../some/otherScript.ts:5:1)
    `;

		vi.spyOn(global, "Error").mockImplementation(function () {
			return errorStub;
		});

		expect(isCalledFromEntrypoint(mockProcessArgv)).toBe(false);
	});

	it("returns false when stack trace format is not as expected", () => {
		const mockProcessArgv = ["/usr/bin/node", "/Users/.../some/scripts/test.ts"];
		const errorStub = new Error("Error");
		errorStub.stack = `Error
          at someOtherFunction (/Users/.../packages/doc-tool/src/anotherFile.ts:5:10)
          at <anonymous> (/Users/.../some/otherFile.ts:15:1)
    `;

		vi.stubGlobal("process", {
			...process,
			argv: mockProcessArgv,
		});

		vi.spyOn(global, "Error").mockImplementation(function () {
			return errorStub;
		});

		expect(isCalledFromEntrypoint(mockProcessArgv)).toBe(false);
	});

	it("returns false when entrypoint doesn't directly call the define function", () => {
		const mockProcessArgv = ["/usr/bin/node", "/Users/.../some/scripts/test.ts"];
		const errorStub = new Error("Error");
		errorStub.stack = `Error
          at isCalledFromEntrypoint (/Users/.../packages/doc-tool/src/config/entrypoint.ts:2:16)
          at defineDocumentationConfig (/Users/.../packages/doc-tool/src/config/define.ts:15:23)
          at fooBar (/Users/.../some/scripts/test.ts:3:1)
          at <anonymous> (/Users/.../some/scripts/test.ts:3:1)
    `;

		vi.spyOn(global, "Error").mockImplementation(function () {
			return errorStub;
		});

		expect(isCalledFromEntrypoint(mockProcessArgv)).toBe(true);
	});
});
