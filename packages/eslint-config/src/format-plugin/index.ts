/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument */
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
import { createSyncFn } from "synckit";
import { messages } from "./constants.js";
import { reportDifferences } from "./diff.js";

let prettierFormat: undefined | ((input: string, options: unknown) => string) = undefined;

// Make sure to check the README.md
export const formatPlugin: FlatConfig.Plugin = {
	rules: {
		prettier: {
			meta: {
				type: "layout",
				docs: {
					description: "Use Prettier to format code",
					category: "Stylistic",
				},
				fixable: "whitespace",
				schema: [
					{
						type: "object",
						properties: {
							parser: {
								type: "string",
								required: true,
							},
						},
						additionalProperties: true,
					},
				],
				messages,
			},
			create(context) {
				if (!prettierFormat) {
					prettierFormat = createSyncFn(
						join(fileURLToPath(new URL("./", import.meta.url)), "worker.cjs"),
					);
				}

				return {
					Program() {
						const sourceCode = context.sourceCode.text;
						const formatted = prettierFormat!(sourceCode, context.options[0] ?? {});

						reportDifferences(context, sourceCode, formatted);
					},
				};
			},
		},
	},
};
