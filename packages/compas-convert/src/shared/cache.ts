import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { SourceFile } from "ts-morph";
import type { Context } from "../context.js";

export class Cache {
	private cacheFile: string;

	constructor(
		private context: Context,
		private sourceFile: SourceFile,
	) {
		const fileDir = path
			.dirname(this.sourceFile.getFilePath())
			.replace(this.context.outputDirectory, "");
		const hash = createHash("md5").update(this.sourceFile.getText()).digest("hex");
		this.cacheFile = `${this.context.cacheDirectory}${fileDir}/${hash}`;
	}

	useIfExists() {
		if (!existsSync(this.cacheFile)) {
			return false;
		}

		this.sourceFile.replaceWithText(readFileSync(this.cacheFile).toString("utf-8"));
		return true;
	}

	store() {
		mkdirSync(path.dirname(this.cacheFile), { recursive: true });
		writeFileSync(this.cacheFile, this.sourceFile.getText());
	}
}
