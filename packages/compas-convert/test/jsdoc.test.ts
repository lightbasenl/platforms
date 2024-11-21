import { expect, suite, test } from "vitest";
import {
	JSDOC_REGEX,
	parseFunctionDocs,
	parseWildcardDocs,
} from "../src/shared/jsdoc.js";

suite("JSDOC_REGEX", () => {
	test("templateTag", () => {
		const inputs: Array<[string, Record<string, unknown>]> = [
			[
				"T",
				{
					names: "T",
				},
			],
			[
				"T, E",
				{
					names: "T, E",
				},
			],
			[
				"[T=string]",
				{
					names: "T",
					defaultValue: "string",
				},
			],
			[
				"{string} T",
				{
					extends: "string",
					names: "T",
				},
			],
			[
				"{{ foo: 1 }} T",
				{
					extends: "{ foo: 1 }",
					names: "T",
				},
			],
			[
				"{{ foo: { bar: boolean } }} T",
				{
					extends: "{ foo: { bar: boolean } }",
					names: "T",
				},
			],
		];

		for (const input of inputs) {
			expect
				.soft(JSDOC_REGEX.templateTag().exec(input[0])?.groups)
				.toMatchObject(input[1]);
		}
	});

	test("paramNameAndDocs", () => {
		const inputs: Array<[string, Record<string, unknown>]> = [
			[
				"T",
				{
					name: "T",
				},
			],
			[
				"T foo",
				{
					name: "T",
					docs: "foo",
				},
			],
			[
				"[T=string]",
				{
					name: "T",
				},
			],
			[
				"type",
				{
					name: "type",
				},
			],
		];

		for (const input of inputs) {
			expect
				.soft(JSDOC_REGEX.nameAndDocsTag().exec(input[0])?.groups)
				.toMatchObject(input[1]);
		}
	});
});

suite("parseFunctionDocs", () => {
	test("extracts a doc only block correctly", () => {
		expect(
			parseFunctionDocs(`/**
 * Foo bar
 * baz
 */
`),
		).toMatchObject({
			docs: "Foo bar\n baz",
			typeParameters: [],
		});
	});

	test("extracts a named template parameter", () => {
		expect(
			parseFunctionDocs(`/**
 * Foo
 *
 * @template T, E
 */
`),
		).toMatchObject({
			docs: "Foo\n",
			typeParameters: [
				{
					name: "T",
				},
				{
					name: "E",
				},
			],
		});
	});

	test("extracts a parameter", () => {
		expect(
			parseFunctionDocs(`/**
 * Foo
 *
 * @param {boolean} flag
 */
`),
		).toMatchObject({
			docs: "Foo\n",
			typeParameters: [],
			parameters: [
				{
					name: "flag",
					typeExpression: "boolean",
				},
			],
		});
	});

	test("extracts multiple parameters", () => {
		expect(
			parseFunctionDocs(`/**
 * Foo
 *
 * @param {boolean} flag
 * @param {{ complex: true }} otherFlag
 */
`),
		).toMatchObject({
			docs: "Foo\n",
			typeParameters: [],
			parameters: [
				{
					name: "flag",
					typeExpression: "boolean",
				},
				{
					name: "otherFlag",
					typeExpression: "{ complex: true }",
				},
			],
		});
	});

	test("extracts a return type", () => {
		expect(
			parseFunctionDocs(`/**
 * @returns {boolean}
 */
`),
		).toMatchObject({
			docs: "",
			typeParameters: [],
			parameters: [],
			returnType: "boolean",
		});
	});
	test("extracts a multi-line return type", () => {
		expect(
			parseFunctionDocs(`/**
 * @returns {{
 *   foo: boolean;
 * }}
 */
`),
		).toMatchObject({
			docs: "",
			typeParameters: [],
			parameters: [],
			returnType: "{\n   foo: boolean;\n }",
		});
	});

	test("full case 1", () => {
		expect(
			parseFunctionDocs(`/**
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
	`),
		).toMatchInlineSnapshot(`
			{
			  "docs": "Some long text, using characters like \`, ', ", {, etc.

			 Even includes a json-like path 'foo.bar.[0].bar'.
			",
			  "parameters": [
			    {
			      "isOptional": false,
			      "name": "context",
			      "typeExpression": "{
			  foo: boolean;
			  bar: baz[]
			 }",
			    },
			    {
			      "isOptional": false,
			      "name": "prefillData",
			      "typeExpression": "import("@foo").Bar<123>",
			    },
			  ],
			  "returnType": "{
			   answers: ModelAnswers,
			   prefillIssues: Array<any>,
			 }",
			  "typeParameters": [],
			}
		`);
	});

	test("full case 2", () => {
		expect(
			parseFunctionDocs(`/**
 * Init Sentry.
 *
 * @param {Record<string, string>} tags Default tags added to each event. Allows us to
 *   differentiate between api & queue.
 */
	`),
		).toMatchInlineSnapshot(`
			{
			  "docs": "Init Sentry.

			  - tags: Default tags added to each event. Allows us to
			   differentiate between api & queue.",
			  "parameters": [
			    {
			      "isOptional": false,
			      "name": "tags",
			      "typeExpression": "Record<string, string>",
			    },
			  ],
			  "returnType": undefined,
			  "typeParameters": [],
			}
		`);
	});
});

suite("parseWildcardDocs", () => {
	test("union typedef", () => {
		expect(
			parseWildcardDocs(
				`/**
 * @typedef {ExternalReportParams | ExternalReportResult} ExternalReportSpec
 */`,
			),
		).toMatchInlineSnapshot(`
			{
			  "contents": "export type ExternalReportSpec = (ExternalReportParams | ExternalReportResult)",
			  "type": "typedef",
			}
		`);
	});
});
