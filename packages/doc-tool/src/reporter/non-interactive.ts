import consola from "consola";
import type { Reporter } from "./types.js";

export const nonInteractiveReporter: Reporter = {
	log: consola.log,
};
