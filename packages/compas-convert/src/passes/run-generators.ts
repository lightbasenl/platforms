import consola from "consola";
import type { Context } from "../context.js";
import { exec, spawn } from "../utils.js";

/**
 * Detect available generate commands and regenerate.
 */
export async function runGenerators(context: Context) {
	const helpOutput = await exec(`npx compas generate --help`, {
		cwd: context.outputDirectory,
	});

	const outputPerLine = helpOutput.stdout.split("\n");
	const commandsStart = outputPerLine.findIndex((it) => it.trim() === "Commands:");
	const flagsStart = outputPerLine.findIndex((it) => it.trim() === "Flags:");
	const commands = outputPerLine
		.slice(commandsStart + 1, flagsStart)
		.filter((it) => it.trim().length > 0)
		.map((it) => it.trim().split(" ")[0] ?? "")
		.filter((it) => !!it);

	const supportsSkipLint = outputPerLine.some((line) => line.includes("--skip-lint"));
	const argsWithSkipLint = (args: Array<string>) =>
		supportsSkipLint ? [...args, "--skip-lint"] : args;

	if (commands.length > 0) {
		consola.log(`Generating for ${commands.join(", ")}...`);
		for (const cmd of commands) {
			await spawn(`npx`, argsWithSkipLint(["compas", "generate", cmd]), {
				cwd: context.outputDirectory,
			});
		}
	} else {
		consola.log(`Generating...`);
		await spawn(`npx`, argsWithSkipLint(["compas", "generate"]), {
			cwd: context.outputDirectory,
		});
	}
}
