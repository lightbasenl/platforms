import type { DocToolCliAndEnvOptions } from "./validate.js";

/**
 * Parses CLI arguments and environment variables to determine command-line options and settings
 * for the application.
 *
 * @param argv Array of command-line arguments.
 * @param env Environment variables as key-value pairs.
 * @param stream Stream to determine if the CLI is in interactive mode.
 */
export function parseCliAndEnvironmentVariables(
	argv: Array<string>,
	env: Record<string, string | undefined>,
	stream: NodeJS.WriteStream,
): DocToolCliAndEnvOptions {
	const isHelp = argv.includes("--help") || argv.includes("-h") || argv.includes("help");
	const isSuggestMode = argv.includes("suggest");

	// Parse github token if available.
	const githubToken = (() => {
		const idx = argv.indexOf("--github-token");
		if (idx === -1) {
			return undefined;
		}

		return argv[idx + 1];
	})();

	// Check for the existence of a glob-filter when suggesting. Defaults to only suggesting on
	// version control changed files.
	const suggestGlob = (() => {
		const idx = argv.indexOf("suggest");
		if (idx === -1) {
			return undefined;
		}
		const possibleValue = argv[idx + 1];
		if (possibleValue === "--github-token" || possibleValue === "--help") {
			// Ignore common flags.
			return undefined;
		}

		return possibleValue;
	})();

	const isCi = env.CI === "true";
	const isGitHub = isCi && env.GITHUB_ACTIONS === "true";
	const isInteractive = stream.isTTY && env.TERM !== "dumb" && !isCi;

	return {
		// Prefer the help command over the other possible commands.
		command:
			isHelp ? "help"
			: isSuggestMode ? "suggest"
			: "check",
		githubToken,
		suggestOnGlob: suggestGlob,
		reporter:
			isGitHub ? "github"
			: isInteractive ? "interactive"
			: "non-interactive",
	};
}
