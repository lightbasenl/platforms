import { exec } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import * as path from "node:path";
import { promisify } from "node:util";

const execPromise = promisify(exec);

export const tmpDir = path.join(
	import.meta.dirname,
	`../.cache/.tmp/${crypto.randomUUID()}`,
);

export const ensureEmptyTestDir = async () => {
	// Create a temporary directory to run our tests in.
	await fs.mkdir(tmpDir, { recursive: true });

	return async () => {
		await fs.rm(tmpDir, { recursive: true, force: true });
	};
};

export async function testOnStdout({
	contents,
	files,
	args,
}: {
	contents: string;
	files?: Array<{ path: string; contents: string }>;
	args?: Array<string>;
}) {
	files ??= [];
	files.push(
		{
			path: "package.json",
			contents: JSON.stringify({ type: "module" }),
		},
		{
			path: "test-generate.ts",
			contents: `
			import { defineDocumentationConfig } from "@lightbase/doc-tool";
			
			// Test contents
			// -------------
			${contents}
			`,
		},
	);

	for (const file of files) {
		const p = path.join(tmpDir, file.path);
		await fs.writeFile(p, file.contents);
	}

	try {
		const promise = execPromise(
			`npx tsx ./test-generate.ts${args?.length ? ` ${args.join(" ")}` : ""}`,
			{
				cwd: tmpDir,
				timeout: 5000,
				env: {
					...process.env,
					CONSOLA_LEVEL: "6",
					FORCE_COLOR: "1",
				},
			},
		);

		const output: {
			stdout: string;
			stderr: string;
			exitCode?: number | null;
		} = await promise;
		output.exitCode = promise.child.exitCode;

		return output;
	} catch (e) {
		if (
			e instanceof Error &&
			"stdout" in e &&
			"stderr" in e &&
			"code" in e &&
			typeof e.stdout === "string" &&
			typeof e.stderr === "string" &&
			typeof e.code === "number"
		) {
			return {
				stdout: e.stdout,
				stderr: e.stderr,
				exitCode: e.code,
			};
		}

		// eslint-disable-next-line no-console
		console.error(e);

		throw e;
	}
}
