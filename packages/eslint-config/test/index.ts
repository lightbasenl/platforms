import assert from "node:assert/strict";
import { exec } from "node:child_process";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { describe, it } from "node:test";
import { promisify } from "node:util";
import type { defineConfig } from "../src/index.js";

const execPromise = promisify(exec);

type Options = Parameters<typeof defineConfig>[0];
async function testOnStdout(
	options: Options,
	files: Array<{ path: string; contents: string }>,
) {
	files.push(
		{
			path: "package.json",
			contents: JSON.stringify({ type: "module" }),
		},
		{
			path: "eslint.config.js",
			contents: `import { defineConfig } from "@lightbase/eslint-config";

export default defineConfig(${JSON.stringify(options)});
`,
		},
	);

	const tmpDir = path.join(import.meta.dirname, `../.tmp/${crypto.randomUUID()}`);
	await fs.mkdir(tmpDir, { recursive: true });
	for (const file of files) {
		const p = path.join(tmpDir, file.path);
		await fs.writeFile(p, file.contents);
	}

	try {
		const promise = execPromise(`npx eslint --format=compact .`, {
			cwd: tmpDir,
			timeout: 5000,
		});

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
	} finally {
		await fs.rm(tmpDir, { recursive: true, force: true });
	}
}

function stdoutLinesForFile(stdout: string, file: string): string {
	return stdout
		.split("\n")
		.filter((it) => it.includes(file))
		.join("\n");
}

void describe(
	"ESLint config behavior",
	{
		concurrency: process.env.CI === "true" ? 1 : 3,
	},
	() => {
		void it("formats markdown files by default", async () => {
			const { stdout } = await testOnStdout({}, [
				{
					path: "index.md",
					contents: "# Foo ",
				},
			]);

			assert.match(stdoutLinesForFile(stdout, "index.md"), /\(format\/prettier\)/);
		});

		void it("doesn't return an error on valid markdown input", async () => {
			const { stdout } = await testOnStdout({}, [
				{
					path: "index.md",
					contents: "# Foo\n",
				},
			]);

			assert.doesNotMatch(stdoutLinesForFile(stdout, "index.md"), /\(format\/prettier\)/);
		});

		void it("also formats markdown code-blocks", async () => {
			const { stdout } = await testOnStdout({}, [
				{
					path: "index.md",
					contents: `# Foo

\`\`\`js
export const foo = 'bar';
\`\`\`
`,
				},
			]);

			assert.match(stdoutLinesForFile(stdout, "index.md"), /with `"bar"`/);
			assert.match(stdoutLinesForFile(stdout, "index.md"), /\(format\/prettier\)/);
		});

		void it("respects global formatter overrides", async () => {
			const { stdout } = await testOnStdout(
				{
					prettier: {
						globalOverride: {
							singleQuote: true,
						},
					},
					globals: [],
				},
				[
					{
						path: "index.js",
						contents: `const foo = "bar";
`,
					},
				],
			);

			assert.match(stdoutLinesForFile(stdout, "index.js"), /with `'bar'`/);
			assert.match(stdoutLinesForFile(stdout, "index.js"), /\(format\/prettier\)/);
		});

		void it("respects language specific formatter overrides", async () => {
			const { stdout } = await testOnStdout(
				{
					prettier: {
						globalOverride: {
							singleQuote: true,
						},
						languageOverrides: {
							js: {
								singleQuote: false,
							},
						},
					},
				},
				[
					{
						path: "index.js",
						contents: `const foo = 'bar';
`,
					},
				],
			);

			assert.match(stdoutLinesForFile(stdout, "index.js"), /with `"bar"`/);
			assert.match(stdoutLinesForFile(stdout, "index.js"), /\(format\/prettier\)/);
		});

		void it("automatically enables typescript support on detection of tsconfig.json", async () => {
			const { stdout } = await testOnStdout({}, [
				{
					path: "tsconfig.json",
					contents: JSON.stringify({
						extends: "@total-typescript/tsconfig/tsc/no-dom/library-monorepo",
						compilerOptions: {
							outDir: "dist",
						},
						include: ["**/*"],
					}),
				},
				{
					path: "index.ts",
					contents: `let foo: 2= 2`,
				},
			]);

			assert.match(
				stdoutLinesForFile(stdout, "index.ts"),
				/\(unused-imports\/no-unused-vars\)/,
			);
			assert.match(stdoutLinesForFile(stdout, "index.ts"), /\(format\/prettier\)/);
		});

		void it("automatically prefers tsconfig.eslint.json over tsconfig.json", async () => {
			const { stdout } = await testOnStdout({}, [
				{
					path: "tsconfig.json",
					contents: JSON.stringify({
						extends: "@total-typescript/tsconfig/tsc/no-dom/library-monorepo",
						compilerOptions: {
							outDir: "dist",
						},
						files: ["./bar.ts"],
					}),
				},
				{
					path: "tsconfig.eslint.json",
					contents: JSON.stringify({
						extends: "@total-typescript/tsconfig/tsc/no-dom/library-monorepo",
						compilerOptions: {
							noEmit: true,
						},
						includes: ["**/*"],
					}),
				},
				{
					path: "index.ts",
					contents: `let foo: 2= 2`,
				},
			]);

			assert.match(
				stdoutLinesForFile(stdout, "index.ts"),
				/\(unused-imports\/no-unused-vars\)/,
			);
			assert.match(stdoutLinesForFile(stdout, "index.ts"), /\(format\/prettier\)/);
		});

		void it("enables js file linting without tsconfig.json", async () => {
			const { stdout } = await testOnStdout({}, [
				{
					path: "index.js",
					contents: `let foo= 2`,
				},
			]);

			assert.match(
				stdoutLinesForFile(stdout, "index.js"),
				/\(unused-imports\/no-unused-vars\)/,
			);
			assert.match(stdoutLinesForFile(stdout, "index.js"), /\(format\/prettier\)/);
		});
	},
);
