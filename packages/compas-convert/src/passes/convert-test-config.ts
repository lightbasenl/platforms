import path from "node:path";
import type { Context } from "../context.js";
import { getTypescriptProgram } from "./init-ts-morph.js";

/**
 * Apply .env loading in the test setup + rename methods
 */
export async function convertTestConfig(context: Context) {
	const configFilePath = path.join(context.outputDirectory, "test/config.ts");

	const program = getTypescriptProgram(context);
	const configFile = program.getSourceFile(configFilePath);

	if (configFile) {
		configFile.replaceWithText(`
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { refreshEnvironmentCache, loggerSetGlobalDestination } from "@compas/stdlib";

await setupTestEnvironment();

${configFile
	.getFullText()
	.replace(
		"export async function setup(): Promise<void> {",
		`
async function setupTestEnvironment(): Promise<void> {
  // Compas-compat: Load default .env values.
  Object.assign(process.env, parseEnv(readFileSync(".env", "utf-8")));
  refreshEnvironmentCache();
  
  // Compas-compat: use console.dir to only print error logs
	loggerSetGlobalDestination({
		write(msg) {
			if (msg.includes(\`"level":"error"\`)) {
				console.dir(msg, { colors: true, depth: null });
			}
		},
	});
`,
	)
	.replace(
		`export async function teardown()`,
		`async function teardownTestEnvironment()`,
	)}
  `);
		await configFile.save();
	}
}
