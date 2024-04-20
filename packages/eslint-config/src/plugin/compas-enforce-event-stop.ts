/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument,@typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-call */

import type { AnyRuleModule } from "@typescript-eslint/utils/ts-eslint";

// Ported from Compas:
// https://github.com/compasjs/compas/blob/72dd8e0df5b315f87d1caf3f101af283db14867c/packages/eslint-plugin/lint-rules/enforce-event-stop.js
export const compasEnforceEventStop: AnyRuleModule = {
	meta: {
		type: "problem",
		docs: {
			description: `Suggest that 'eventStop' is called in async functions that define 'event' as its first parameter.`,
		},
		hasSuggestions: true,

		messages: {
			missingEventStop: `Expected a call to 'eventStop' before this return.`,
			addEventStop: "Add 'eventStop(event)' before the return statement.",
		},

		schema: [],
	},

	defaultOptions: [],

	create(context) {
		// Tries to keep track of the current function in a stack like way.
		// The current function is assigned to this variable, child functions refer to their 'parent'.
		let currentFunction: any;

		function processFunctionStart(node: any) {
			currentFunction = {
				parent: currentFunction,
				node,
				isAsyncEventFunction: node.async && node.params[0]?.name === "event",
				hasEventStart: false,
				block: undefined,
			};
		}

		function processFunctionEnd() {
			currentFunction = currentFunction.parent;
		}

		function blockEnter(node: any) {
			if (!currentFunction) {
				return;
			}

			currentFunction.block = {
				node,
				parent: currentFunction.block,
				hasEventStop: currentFunction.block?.hasEventStop ?? false,
				hasEventStart: currentFunction.block?.hasEventStart ?? false,
				returnStatement: undefined,
				children: [],
			};
			if (currentFunction.block.parent) {
				currentFunction.block.parent.children.push(currentFunction.block);
			}
		}

		function blockExit(node: any) {
			if (!currentFunction) {
				return;
			}

			const block = currentFunction.block;
			currentFunction.block = currentFunction.block?.parent;

			if (!currentFunction.isAsyncEventFunction || !currentFunction.hasEventStart) {
				return;
			}

			const blocksFound = !(
				block.children.length === 0 && block.node.parent.type.includes("Function")
			);

			const noBareIfStatementFound = !(
				block.node.parent.type.includes("Function") &&
				block.children.length === 1 &&
				block.children[0].node === block.children[0].node.parent?.consequent &&
				block.children[0].returnStatement
			);

			// If there is no return statement, we are not sure if this code path is reachable
			if (!block.returnStatement && blocksFound && noBareIfStatementFound) {
				return;
			}

			const hasEventStop = block.hasEventStop;

			if (hasEventStop) {
				return;
			}

			context.report({
				node: block.returnStatement ?? node,
				messageId: "missingEventStop",
				suggest:
					block.returnStatement ?
						[
							{
								messageId: "addEventStop",
								fix: (fixer) =>
									fixer.insertTextBefore(block.returnStatement, "eventStop(event);\n"),
							},
						]
					:	[],
			});
		}

		return {
			// Manage function scopes
			":function": processFunctionStart,
			":function:exit": processFunctionEnd,

			// Manage block scopes
			"BlockStatement": blockEnter,
			"BlockStatement:exit": blockExit,

			// Check if eventStop is called
			"CallExpression[callee.name='eventStop']"() {
				if (currentFunction?.block) {
					currentFunction.block.hasEventStop = true;
				}
			}, // Check if eventStop is called
			"CallExpression[callee.name='eventStart']"() {
				if (currentFunction?.block) {
					currentFunction.hasEventStart = true;
					currentFunction.block.hasEventStart = true;
				}
			},

			// Check if block has return statement
			"ReturnStatement"(node) {
				if (currentFunction?.block) {
					currentFunction.block.returnStatement = node;
				}
			},

			// Edge cases for inline blocks
			"WhileStatement[body.type='ReturnStatement']"(node) {
				if (!currentFunction.isAsyncEventFunction || !currentFunction.hasEventStart) {
					return;
				}

				if (currentFunction.block.hasEventStop) {
					return;
				}

				context.report({
					// @ts-expect-error unknown
					node: node.body,
					messageId: "missingEventStop",
					suggest: [
						{
							messageId: "addEventStop",
							// @ts-expect-error unknown
							fix: (fixer) => {
								// @ts-expect-error unknown
								fixer.insertTextBefore(node.body, "{\neventStop(event);\n");
								// @ts-expect-error unknown
								fixer.insertTextAfter(node.body, "}");
							},
						},
					],
				});
			},
			"IfStatement[consequent.type='ReturnStatement']"(node) {
				if (!currentFunction?.isAsyncEventFunction || !currentFunction.hasEventStart) {
					return;
				}

				if (currentFunction.block?.hasEventStop) {
					return;
				}

				context.report({
					// @ts-expect-error unknown
					node: node.consequent,
					messageId: "missingEventStop",
					suggest: [
						{
							messageId: "addEventStop",
							// @ts-expect-error unknown
							fix: (fixer) => {
								// @ts-expect-error unknown
								fixer.insertTextBefore(node.consequent, "{\neventStop(event);\n");
								// @ts-expect-error unknown
								fixer.insertTextAfter(node.consequent, "}");
							},
						},
					],
				});
			},
			"IfStatement[alternate.type='ReturnStatement']"(node) {
				if (!currentFunction?.isAsyncEventFunction || !currentFunction.hasEventStart) {
					return;
				}

				if (currentFunction.block?.hasEventStop) {
					return;
				}

				context.report({
					// @ts-expect-error unknown
					node: node.alternate,
					messageId: "missingEventStop",
					suggest: [
						{
							messageId: "addEventStop",
							// @ts-expect-error unknown
							fix: (fixer) => {
								// @ts-expect-error unknown
								fixer.insertTextBefore(node.alternate, "{\neventStop(event);\n");
								// @ts-expect-error unknown
								fixer.insertTextAfter(node.alternate, "}");
							},
						},
					],
				});
			},
		};
	},
};
