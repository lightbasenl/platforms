#!/usr/bin/env node

import path from "node:path";
import consola from "consola";

try {
	await import(path.join(import.meta.dirname, "dist", "src", "index.js"));
} catch (e) {
	consola.error(`Process failed, caused be either:

- The correct files aren't packaged. Run 'npm run build:ws' to fix this.
- The program failed for some other reason, see the output below.`);
	consola.error(e);
}
