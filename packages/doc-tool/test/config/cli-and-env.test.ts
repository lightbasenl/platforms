import { describe, expect, it } from "vitest";
import { parseCliAndEnvironmentVariables } from "../../src/config/cli-and-env.js";

describe("parseCliAndEnvironmentVariables", () => {
	it("should return command 'help' when '--help' is passed in argv", () => {
		const result = parseCliAndEnvironmentVariables(["--help"], {}, {
			isTTY: true,
		} as NodeJS.WriteStream);

		expect(result).toEqual({
			command: "help",
			githubToken: undefined,
			suggestOnGlob: undefined,
			reporter: "interactive",
		});
	});

	it("should return command 'suggest' with no suggest glob if only 'suggest' is passed in argv", () => {
		const result = parseCliAndEnvironmentVariables(["suggest"], {}, {
			isTTY: true,
		} as NodeJS.WriteStream);

		expect(result).toEqual({
			command: "suggest",
			githubToken: undefined,
			suggestOnGlob: undefined,
			reporter: "interactive",
		});
	});

	it("should return command 'suggest' with suggest glob if provided", () => {
		const result = parseCliAndEnvironmentVariables(["suggest", "./src/**/*.ts"], {}, {
			isTTY: true,
		} as NodeJS.WriteStream);

		expect(result).toEqual({
			command: "suggest",
			githubToken: undefined,
			suggestOnGlob: "./src/**/*.ts",
			reporter: "interactive",
		});
	});

	it("should use '--github-token' value when passed in argv", () => {
		const result = parseCliAndEnvironmentVariables(["--github-token", "abc123"], {}, {
			isTTY: true,
		} as NodeJS.WriteStream);

		expect(result).toEqual({
			command: "check",
			githubToken: "abc123",
			suggestOnGlob: undefined,
			reporter: "interactive",
		});
	});

	it("should return reporter 'interactive' in interactive terminal environment", () => {
		const result = parseCliAndEnvironmentVariables([], {}, {
			isTTY: true,
		} as NodeJS.WriteStream);

		expect(result).toEqual({
			command: "check",
			githubToken: undefined,
			suggestOnGlob: undefined,
			reporter: "interactive",
		});
	});

	it("should return reporter 'non-interactive' in non-interactive terminal environment", () => {
		const result = parseCliAndEnvironmentVariables([], {}, {
			isTTY: false,
		} as NodeJS.WriteStream);

		expect(result).toEqual({
			command: "check",
			githubToken: undefined,
			suggestOnGlob: undefined,
			reporter: "non-interactive",
		});
	});

	it("should return reporter 'github' when 'GITHUB_ACTIONS' is true in CI environment", () => {
		const result = parseCliAndEnvironmentVariables(
			[],
			{
				CI: "true",
				GITHUB_ACTIONS: "true",
			},
			{
				isTTY: true,
			} as NodeJS.WriteStream,
		);

		expect(result).toEqual({
			command: "check",
			githubToken: undefined,
			suggestOnGlob: undefined,
			reporter: "github",
		});
	});

	it("should prefer '--help' over 'suggest' when both are passed in argv", () => {
		const result = parseCliAndEnvironmentVariables(["suggest", "--help"], {}, {
			isTTY: true,
		} as NodeJS.WriteStream);

		expect(result).toEqual({
			command: "help",
			githubToken: undefined,
			suggestOnGlob: undefined,
			reporter: "interactive",
		});
	});
});
