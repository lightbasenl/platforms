import type { Context } from "../context.js";
import { spawn } from "../utils.js";
import { getTypescriptProgram } from "./init-ts-morph.js";

export async function typescriptDiagnostics(context: Context) {
	await getTypescriptProgram(context).save();

	await spawn(`npm`, ["run", "build"], {
		cwd: context.outputDirectory,
	});
}
