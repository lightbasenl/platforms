import type { SpawnOptions } from "node:child_process";
import { spawn as cpSpawn } from "node:child_process";

export function isNil(value: unknown): value is null | undefined {
	return value === null || value === undefined;
}

export function isUnknownRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && !isNil(value);
}

export function objectWithKey<const K extends string>(
	value: unknown,
	key: K,
): value is Record<K, unknown> {
	return isUnknownRecord(value) && key in value;
}

/**
 * Wrap around Node.js child_process#spawn. Resolving when the sub process has exited. The
 * resulting object contains the 'exitCode' of the sub process.
 * By default 'stdio' is inherited from the current process.
 */
export function spawn(command: string, args: Array<string>, opts: SpawnOptions = {}) {
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