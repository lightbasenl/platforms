import { exec } from "node:child_process";
import * as crypto from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { promisify } from "node:util";
import { afterAll, beforeAll, expect, test } from "vitest";
import type { defineConfig } from "../src/index.js";

const execPromise = promisify(exec);

type Options = Parameters<typeof defineConfig>[0];

const tmpDir = path.join(import.meta.dirname, `../.cache/.tmp/${crypto.randomUUID()}`);

beforeAll(async () => {
	// We are going to execute ESLint, so make sure that we have an up-to-date build
	await execPromise("npm run build");

	// Create a temporary directory to run our tests in.
	await fs.mkdir(tmpDir, { recursive: true });
});

afterAll(async () => {
	await fs.rm(tmpDir, { recursive: true, force: true });
});

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

	for (const file of files) {
		const p = path.join(tmpDir, file.path);
		await fs.writeFile(p, file.contents);
	}

	try {
		const promise = execPromise(`npx eslint --format=compact . --cache`, {
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
	}
}

function stdoutLinesForFile(stdout: string, file: string): string {
	return stdout
		.split("\n")
		.filter((it) => it.includes(file))
		.join("\n");
}

test("formats markdown files by default", async () => {
	const { stdout } = await testOnStdout({}, [
		{
			path: "index.md",
			contents: "# Foo ",
		},
	]);

	expect(stdoutLinesForFile(stdout, "index.md")).toMatch(/\(format\/prettier\)/);
});

test("doesn't return an error on valid markdown input", async () => {
	const { stdout } = await testOnStdout({}, [
		{
			path: "index.md",
			contents: "# Foo\n",
		},
	]);

	expect(stdoutLinesForFile(stdout, "index.md")).not.toMatch(/\(format\/prettier\)/);
});

test("also formats markdown code-blocks", async () => {
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

	expect(stdoutLinesForFile(stdout, "index.md")).toMatch(/with `"bar"`/);
	expect(stdoutLinesForFile(stdout, "index.md")).toMatch(/\(format\/prettier\)/);
});

test("respects global formatter overrides", async () => {
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

	expect(stdoutLinesForFile(stdout, "index.js")).toMatch(/with `'bar'`/);
	expect(stdoutLinesForFile(stdout, "index.js")).toMatch(/\(format\/prettier\)/);
});

test("respects language specific formatter overrides", async () => {
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

	expect(stdoutLinesForFile(stdout, "index.js")).toMatch(/with `"bar"`/);
	expect(stdoutLinesForFile(stdout, "index.js")).toMatch(/\(format\/prettier\)/);
});

test("automatically enables typescript support on detection of tsconfig.json", async () => {
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

	expect(stdoutLinesForFile(stdout, "index.ts")).toMatch(
		/\(unused-imports\/no-unused-vars\)/,
	);
	expect(stdoutLinesForFile(stdout, "index.ts")).toMatch(/\(format\/prettier\)/);
});

test("automatically prefers tsconfig.eslint.json over tsconfig.json", async () => {
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

	expect(stdoutLinesForFile(stdout, "index.ts")).toMatch(
		/\(unused-imports\/no-unused-vars\)/,
	);
	expect(stdoutLinesForFile(stdout, "index.ts")).toMatch(/\(format\/prettier\)/);
});

test("enables js file linting without tsconfig.json", async () => {
	const { stdout } = await testOnStdout({}, [
		{
			path: "index.js",
			contents: `let foo= 2`,
		},
	]);

	expect(stdoutLinesForFile(stdout, "index.js")).toMatch(
		/\(unused-imports\/no-unused-vars\)/,
	);
	expect(stdoutLinesForFile(stdout, "index.js")).toMatch(/\(format\/prettier\)/);
});
