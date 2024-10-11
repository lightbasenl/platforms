import { parse as commentParserExternal } from "comment-parser";
import { bench, describe } from "vitest";
import { parseFunctionDocs } from "../src/shared/jsdoc.js";

const input = `/**
	 * Some long text, using characters like \`, ', ", {, etc.
	 *
	 * Even includes a json-like path 'foo.bar.[0].bar'.
	 *
	 * @param {{
	 *  foo: boolean;
	 *  bar: baz[]
	 * }} context
	 * @param {import("@foo").Bar<123>} prefillData
	 * @returns {{
	 *   answers: ModelAnswers,
	 *   prefillIssues: Array<any>,
	 * }}
	 */
	`;

describe("jsdoc", () => {
	bench("parseFunctionDocs", () => {
		parseFunctionDocs(input);
	});

	bench("comment-parser", () => {
		commentParserExternal(input);
	});
});
