import consola from "consola";
import { describe, expect, it, vi } from "vitest";
import { startDocTool } from "../../src/config/define.js";

describe("help command", () => {
	it("should display help information", () => {
		const consolaInfo = vi.spyOn(consola, "log");

		startDocTool(
			{
				contentRoots: [],
			},
			{
				command: "help",
				reporter: "non-interactive",
			},
			"./docs.config.ts",
		);

		expect(consolaInfo).toHaveBeenCalled();
	});
});
