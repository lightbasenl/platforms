import { exec, spawn as cpSpawn } from "node:child_process";
import type { SpawnOptions } from "node:child_process";
import { promisify } from "node:util";

export const execAsync = promisify(exec);

/**
 * Wrap around Node.js child_process#spawn. Resolving when the sub process has exited. The
 * resulting object contains the 'exitCode' of the sub process.
 * By default 'stdio' is inherited from the current process.
 */
export function spawnAsync(
	command: string,
	args: Array<string>,
	opts: SpawnOptions = {},
) {
	return new Promise((resolve, reject) => {
		const childProcess = cpSpawn(command, args, { stdio: "inherit", ...opts });

		const exitHandler = (signal: number) => {
			childProcess.kill(signal);
		};

		process.once("exit", exitHandler);

		childProcess.once("error", (...args) => {
			process.removeListener("exit", exitHandler);

			return reject(...args);
		});

		childProcess.once("exit", (code) => {
			process.removeListener("exit", exitHandler);

			resolve({ exitCode: code ?? 0 });
		});
	});
}
