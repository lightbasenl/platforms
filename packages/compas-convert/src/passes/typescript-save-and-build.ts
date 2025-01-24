import type { Context } from "../context.js";
import { spawnAsync } from "../shared/exec.js";
import { getTypescriptProgram } from "./init-ts-morph.js";

export async function typescriptDiagnostics(context: Context) {
	await getTypescriptProgram(context).save();

	await spawnAsync(`npm`, ["run", "build"], {
		cwd: context.outputDirectory,
	});
}
