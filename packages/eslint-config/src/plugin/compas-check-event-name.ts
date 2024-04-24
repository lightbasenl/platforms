/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument */
import type { AnyRuleModule } from "@typescript-eslint/utils/ts-eslint";

// Ported from Compas:
// https://github.com/compasjs/compas/blob/72dd8e0df5b315f87d1caf3f101af283db14867c/packages/eslint-plugin/lint-rules/check-event-name.js /
// https://github.com/compasjs/compas/blob/491561c10ccc52ba32df2cd740fc7594a4b268ea/packages/eslint-plugin/lint-rules/check-event-name.js
export const compasCheckEventName: AnyRuleModule = {
	meta: {
		type: "suggestion",
		docs: {
			description: `Suggest that the 'event.name' passed to 'eventStart' is a derivative from the function name.`,
		},
		hasSuggestions: true,

		messages: {
			consistentEventName: "Use an event name that can be derived from the function name",
			replaceEventName: `Replace value with {{value}}`,
			missingEventStart:
				"Function accepts 'event' as the first argument, but doesn't call 'eventStart'.",
			addEventStart: `Add 'eventStart(event, "")' in your function body.`,
		},

		schema: [],
	},

	defaultOptions: [],

	create(context) {
		let currentFunction: any;

		function processFunctionStart(node: any) {
			currentFunction = {
				parent: currentFunction,
				node,
				isAsyncEventFunction:
					node.async && node.id?.name && node.params[0]?.name === "event",
				hasEventStart: false,
				functionName: node.id?.name,
			};
		}

		function processFunctionEnd() {
			if (currentFunction?.isAsyncEventFunction && !currentFunction.hasEventStart) {
				context.report({
					node: currentFunction.node.body,
					messageId: "missingEventStart",
					suggest: [
						{
							messageId: "addEventStart",
							data: {},
							fix: function (fixer) {
								return fixer.insertTextBefore(
									currentFunction.node.body.body[0],
									`eventStart(event, "");\n  `,
								);
							},
						},
					],
				});
			}

			currentFunction = currentFunction.parent;
		}

		return {
			// Manage function scopes
			":function": processFunctionStart,
			":function:exit": processFunctionEnd,

			// Process `eventStart` calls
			"CallExpression[callee.name='eventStart']"(node) {
				if (!currentFunction.isAsyncEventFunction) {
					return;
				}

				// @ts-expect-error unknown
				if (node.arguments?.length !== 2) {
					return;
				}

				currentFunction.hasEventStart = true;

				let value = undefined;
				// @ts-expect-error unknown
				if (node.arguments[1].type === "Literal") {
					// @ts-expect-error unknown
					value = node.arguments[1].value;
				}

				if (
					// @ts-expect-error unknown
					node.arguments[1].type === "TemplateLiteral" && // @ts-expect-error unknown
					node.arguments[1].expressions.length === 0 && // @ts-expect-error unknown
					node.arguments[1].quasis.length === 1
				) {
					// @ts-expect-error unknown
					value = node.arguments[1].quasis[0].value.raw;
				}

				if (value === null || value === undefined || typeof value !== "string") {
					return;
				}

				const fnNameParts = (currentFunction.functionName as string)
					.split(/(?=[A-Z])/)
					.map((it) => it.toLowerCase());
				const validEventNames = calculateValidEventNames(fnNameParts);

				if (validEventNames.includes(value)) {
					return;
				}

				context.report({
					// @ts-expect-error unknown
					node: node.arguments[1],
					messageId: "consistentEventName",
					suggest: validEventNames.map((it) => {
						return {
							messageId: "replaceEventName",
							data: {
								value: it,
							},
							fix: function (fixer) {
								// @ts-expect-error unknown
								return fixer.replaceText(node.arguments[1], `"${it}"`);
							},
						};
					}),
				});
			},
		};
	},
};

/**
 * Computes all possible camelCase.dotVariants for the given parts.
 */
function calculateValidEventNames(parts: Array<string>) {
	const result = [];

	if (parts.length === 1) {
		return parts;
	}

	for (let i = 1; i < parts.length; ++i) {
		let str = "";

		for (let j = 0; j < parts.length; ++j) {
			if (j === 0) {
				str += parts[j];
			} else if (i === j) {
				str += ".";
				str += parts[j];
			} else {
				// @ts-expect-error unknown
				str += parts[j][0].toUpperCase() + parts[j].substring(1);
			}
		}

		result.push(str);
	}

	return result;
}
