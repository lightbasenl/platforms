import type { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
import { compasCheckEventName } from "./compas-check-event-name.js";
import { compasEnforceEventStop } from "./compas-enforce-event-stop.js";
import { nodeBuiltinModuleUrlImport } from "./node-builtin-module-url-import.js";

export const lightbaseInternalPlugin: FlatConfig.Plugin = {
	rules: {
		"node-builtin-module-url-import": nodeBuiltinModuleUrlImport,
		"compas-check-event-name": compasCheckEventName,
		"compas-enforce-event-stop": compasEnforceEventStop,
	},
};
