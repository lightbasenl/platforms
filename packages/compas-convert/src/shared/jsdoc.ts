import consola from "consola";
import type { FunctionDeclaration, JSDocTypeExpression, SourceFile } from "ts-morph";
import type { Context } from "../context.js";
import { CONVERT_UTIL, getTypescriptProgram } from "../passes/init-ts-morph.js";
import { addPendingImport } from "./imports.js";

export function typeExpressionToInlineType(
	context: Context,
	sourceFile: SourceFile,
	typeExpression: JSDocTypeExpression | string,
) {
	let type = typeof typeExpression === "string" ? typeExpression : "";

	if (typeof typeExpression !== "string") {
		type = typeExpression.getTypeNode().getText();
	}

	type = type.trim();
	if (type.length === 0) {
		return CONVERT_UTIL.any;
	}

	if (/^[\w|\s<>,.]+$/gi.test(type)) {
		// number, boolean, FooBar, foo|bar, Foo<string>, Foo.Bar,
		return type;
	}

	return type.replaceAll(
		/(typeof )?import\(\s*"(.+)"\s*\)\s*\.(\w+)/gi,
		(group, ...match) => {
			// Cleanup import("foo").Bar into a type import.
			const hasTypeof = typeof match[0] === "string" && match[0].length > 0;
			const moduleName = match[1] as unknown;
			const symbolName = match[2] as unknown;

			if (
				hasTypeof ||
				typeof moduleName !== "string" ||
				moduleName.length === 0 ||
				typeof symbolName !== "string" ||
				symbolName.length === 0
			) {
				return group;
			}

			addPendingImport(context, sourceFile, moduleName, symbolName, !hasTypeof);
			return hasTypeof ? `typeof ${symbolName}` : symbolName;
		},
	);
}

/**
 * Extracts doc blocks from the function and tries to convert the types to inline types.
 */
export function assignSignatureTagsToFunction(
	context: Context,
	fn: FunctionDeclaration,
	paramOverrides?: Record<string, string>,
) {
	getTypescriptProgram(context).forgetNodesCreatedInBlock(() => {
		const sourceFile = fn.getSourceFile();
		const [firstDocBlock] = fn.getJsDocs().reverse();
		const functionDocString = firstDocBlock?.getFullText() ?? "";

		if (firstDocBlock) {
			firstDocBlock.remove();
		}

		const parsedDocs = parseFunctionDocs(functionDocString);
		const debugObject = {
			name: fn.getName(),
			parsedDocs,
			functionDocString,
			paramOverrides,
		};

		try {
			const params = fn.getParameters();
			for (const param of params) {
				const paramInfo = parsedDocs.parameters.find((it) => it.name === param.getName());
				const typeExpression =
					paramOverrides?.[param.getName()] ??
					paramInfo?.typeExpression ??
					param.getTypeNode()?.getText() ??
					CONVERT_UTIL.any;

				param.setType(typeExpressionToInlineType(context, sourceFile, typeExpression));
			}

			if (parsedDocs.returnType) {
				fn.setReturnType(
					typeExpressionToInlineType(context, sourceFile, parsedDocs.returnType),
				);
			}

			fn.addTypeParameters(
				parsedDocs.typeParameters.map((it) => ({
					name: it.name,
					constraint:
						it.extends ?
							typeExpressionToInlineType(context, sourceFile, it.extends)
						:	undefined,
					default: it.defaultValue,
				})),
			);

			if (parsedDocs.docs.length) {
				fn.addJsDoc((writer) => {
					for (const line of parsedDocs.docs.trim().split("\n")) {
						writer.writeLine(`${line}`);
					}
				});
			}
		} catch (e) {
			consola.error(debugObject);
			throw e;
		}
	});
}

export const JSDOC_REGEX = {
	templateTag: () =>
		/^(?:\{(?<extends>.+)})?\s*\[?(?:(?<names>\w+(,\s+\w+)*)(?:=(?<defaultValue>\w+))?]?)?/gi,
	typeExpressionTag: () => /^(?:\{(?<typeExpression>[\S\s]+)})?/gi,

	// TODO: Extract optionality and add as `?:` to the parameter
	nameAndDocsTag: () => /^\s*\[?(?<name>\w+)(?:=.+?)?]?\s*(?<docs>[\S\s]+)?$/gi,
};

type ParseState = {
	globalIndex: number;
	lastNewLineIndex: number;
	contents: string;

	peekAt(index: number): string;
	currentChar(): string;
	moveNext(): void;
	atEnd(): boolean;
};

function createParseState(input: string): ParseState {
	const state = {
		globalIndex: 0,
		lastNewLineIndex: -1,
		contents: stripDocBlock(input),
	} as ParseState;

	state.peekAt = (index: number) => state.contents.charAt(state.globalIndex + index);
	state.currentChar = () => state.contents.charAt(state.globalIndex);
	state.moveNext = () => state.globalIndex++;
	state.atEnd = () => state.globalIndex >= state.contents.length;

	return state;
}

type DocBlockResult =
	| {
			type: "typedef" | "unknown";
			contents: string;
	  }
	| {
			type: "type";
			docs: string;
			typeExpression?: string;
	  };

export function parseWildcardDocs(
	docBlock: string | undefined,
): DocBlockResult | undefined {
	if (!docBlock?.trim()) {
		return undefined;
	}

	const state = createParseState(docBlock);
	if (state.contents.includes("@typedef")) {
		return {
			type: "typedef",
			contents: parseTypedef(state),
		};
	} else if (state.contents.includes("@type")) {
		return {
			...parseTypeDocs(docBlock),
			type: "type",
		};
	} else if (!/^\s*@\w+/gim.test(state.contents)) {
		// No @jsdoc tag found. Assume this is just a doc block.
		return {
			type: "unknown",
			contents: docBlock,
		};
	}

	return {
		type: "unknown",
		contents: `// TODO(compas-convert): Unknown doc block...\n${docBlock}`,
	};
}

function parseTypedef(state: ParseState) {
	const intermediate: {
		docs: string;
		extends?: string;
		name: string;
		properties: Array<{
			name: string;
			typeExpression: string;
			docs: string;
		}>;
	} = {
		docs: "",
		extends: undefined,
		name: "",
		properties: [],
	};

	while (!state.atEnd()) {
		skipEmptySpace(state);

		if (isPossibleStartOfTag(state)) {
			if (isMatchedTag(state, "typedef")) {
				const typedef = parseNamedTypeExpression(state, ["@typedef", "@property"]);
				intermediate.name = typedef.name;
				intermediate.extends = typedef.typeExpression;
				intermediate.docs += `\n${typedef.docs}`;

				continue;
			}

			if (isMatchedTag(state, "property")) {
				const property = parseNamedTypeExpression(state, ["@property"]);
				intermediate.properties.push({
					name: property.name,
					typeExpression: property.typeExpression,
					docs: property.docs,
				});

				continue;
			}
		}

		parseDocs(state, intermediate);
	}

	let result = convertStringToJSDoc(intermediate.docs);
	result += `export type ${intermediate.name} = `;
	if (intermediate.extends && intermediate.extends !== "object") {
		result += `(${intermediate.extends})`;

		if (intermediate.properties.length) {
			result += ` & `;
		}
	}

	if (intermediate.properties.length) {
		result += `{\n`;
		for (const prop of intermediate.properties) {
			result += convertStringToJSDoc(prop.docs);
			result += `${prop.name}: ${prop.typeExpression};\n`;
		}

		result += `};`;
	}

	return result;
}

type TypeDocResult = {
	docs: string;
	typeExpression?: string;
};

export function parseTypeDocs(typeDocBlock: string | undefined) {
	const result: TypeDocResult = {
		docs: "",
		typeExpression: undefined,
	};

	if (!typeDocBlock?.trim()) {
		return result;
	}

	const state: ParseState = createParseState(typeDocBlock);

	while (!state.atEnd()) {
		skipEmptySpace(state);

		if (isPossibleStartOfTag(state)) {
			// We start some form of tag.
			if (isMatchedTag(state, "type")) {
				parseType();
				continue;
			}
		}

		// We expect all tag parsers to have handled the full match. Everything else is docs;
		parseDocs(state, result);
	}

	function parseType() {
		// We don't support anything after the 'type' tag, so take the remaining input.
		const input = state.contents.slice(state.globalIndex);
		const reMatch = JSDOC_REGEX.typeExpressionTag().exec(input);
		if (!reMatch) {
			throw new Error(`Couldn't match a @type on input: '${input}'.`, {
				cause: {
					state,
				},
			});
		}

		state.globalIndex = state.contents.length;
		const match = reMatch.groups ?? {};
		result.typeExpression = match.typeExpression ?? CONVERT_UTIL.any;
	}

	return result;
}

type FunctionDocResult = {
	docs: string;
	typeParameters: Array<{
		name: string;
		extends?: string;
		defaultValue?: string;
	}>;
	parameters: Array<{
		name: string;
		typeExpression: string;
	}>;
	returnType?: string;
};

export function parseFunctionDocs(functionDocBlock: string | undefined) {
	const result: FunctionDocResult = {
		docs: "",
		typeParameters: [],
		parameters: [],
		returnType: undefined,
	};

	if (!functionDocBlock?.trim()) {
		return result;
	}

	const state: ParseState = createParseState(functionDocBlock);

	while (!state.atEnd()) {
		skipEmptySpace(state);

		if (isPossibleStartOfTag(state)) {
			// We start some form of tag.
			if (isMatchedTag(state, "template")) {
				parseTypeParameter();
				continue;
			}

			if (isMatchedTag(state, "param")) {
				const definedParam = parseNamedTypeExpression(state, ["@param", "@returns"]);
				result.parameters.push({
					name: definedParam.name,
					typeExpression: definedParam.typeExpression,
				});

				if (definedParam.docs) {
					result.docs += `\n  - ${definedParam.name}: ${definedParam.docs}`;
				}

				continue;
			}

			if (isMatchedTag(state, "returns")) {
				parseReturns();
				continue;
			}
		}

		// We expect all tag parsers to have handled the full match. Everything else is docs;
		parseDocs(state, result);
	}

	function parseTypeParameter() {
		let nextNewLine: undefined | number = state.contents.indexOf("\n", state.globalIndex);
		if (nextNewLine === -1) {
			// Make sure that we don't truncate the last character of an input
			nextNewLine = undefined;
		}

		const input = state.contents.slice(state.globalIndex, nextNewLine);
		const reMatch = JSDOC_REGEX.templateTag().exec(input);
		if (!reMatch) {
			throw new Error(`Couldn't match a @template on input: '${input}'.`);
		}

		state.globalIndex += reMatch.input.length;

		const match = reMatch.groups ?? {};

		const names = (match.names ?? "").split(", ");
		const extendsValue = match.extends ?? undefined;
		const defaultValue = match.defaultValue ?? undefined;

		for (const name of names) {
			result.typeParameters.push({
				name,
				extends: extendsValue,
				defaultValue,
			});
		}
	}

	function parseReturns() {
		// We don't support anything after the returns tag, so take the remaining input.
		const input = state.contents.slice(state.globalIndex);
		const reMatch = JSDOC_REGEX.typeExpressionTag().exec(input);
		if (!reMatch) {
			throw new Error(`Couldn't match a @returns on input: '${input}'.`);
		}

		state.globalIndex = state.contents.length;
		const match = reMatch.groups ?? {};
		result.returnType = match.typeExpression ?? CONVERT_UTIL.any;
	}

	return result;
}

function stripDocBlock(input: string) {
	return input
		.replaceAll("/**", "")
		.replaceAll("*/", "")
		.replaceAll(/^\s*\*/gim, "")
		.trim();
}

function skipEmptySpace(state: ParseState) {
	if (state.currentChar() === "\n") {
		// Move past all whitespace
		state.moveNext();

		while (!state.atEnd()) {
			const char = state.currentChar();
			if (char === " " || char === "\n" || char === "\r" || char === "\t") {
				state.moveNext();
			} else {
				break;
			}
		}

		// Ignores all whitespace after the newline, but to ease the logic below, we move the index to
		// the last skipped index.
		state.lastNewLineIndex = state.globalIndex - 1;
	}
}

function lastNewLineFor(state: ParseState, input: string) {
	const indexOf = state.contents.indexOf(input, state.globalIndex);
	if (indexOf === -1) {
		return -1;
	}

	return state.contents.lastIndexOf("\n", indexOf);
}

function parseDocs(state: ParseState, result: { docs: string }) {
	while (!state.atEnd()) {
		if (
			state.currentChar() === "\n" &&
			(state.peekAt(1) === " " || state.peekAt(1) === "\t") &&
			state.peekAt(2) === "@"
		) {
			// We might be starting a tag. Breakout, let skipWhitespace handle the remaining newlines
			// and stuff
			break;
		}

		result.docs += state.currentChar();
		state.moveNext();
	}
}

function parseNamedTypeExpression(state: ParseState, stopTags: Array<string>) {
	// Determine the length of the full param tag, by finding other known tags or end-of input.
	const lastIndex = Math.min(
		...[...stopTags.map((it) => lastNewLineFor(state, it)), state.contents.length].filter(
			(it) => it !== -1,
		),
	);

	// 1. {type} param
	// 2. param
	// 3. {type} [param] docs
	// 4. {type} [param=5] docs
	let input = state.contents.slice(state.globalIndex, lastIndex);
	state.globalIndex = lastIndex;
	input = input.trim();

	let typeExpression: string = CONVERT_UTIL.any;

	if (input.startsWith("{")) {
		// Brace match until the end of the typeExpression. We assume that the type expression is
		// valid, so we only have to match against '}'.

		let stack = 1;
		for (let i = 1; i < input.length; ++i) {
			if (input[i] === "{") {
				stack += 1;
			} else if (input[i] === "}") {
				stack -= 1;
			}

			if (stack === 0) {
				typeExpression = input.slice(1, i);
				input = input.slice(i + 1).trim();
				break;
			}
		}
	}

	const reMatch = JSDOC_REGEX.nameAndDocsTag().exec(input);
	if (!reMatch) {
		throw new Error(`Couldn't match a @param name on input: '${input}'.`);
	}

	const match = reMatch.groups ?? {};

	return {
		name: match.name ?? "",
		typeExpression,
		docs: match.docs?.trim() ?? "",
	};
}

function isPossibleStartOfTag(state: ParseState) {
	return state.lastNewLineIndex === state.globalIndex - 1 && state.currentChar() === "@";
}

function isMatchedTag(state: ParseState, tag: string) {
	if (state.contents.indexOf(`@${tag} `, state.globalIndex) === state.globalIndex) {
		state.globalIndex += `@${tag} `.length;
		return true;
	}
	return false;
}

export function convertStringToJSDoc(input: string) {
	if (input.trim().length === 0) {
		return "";
	}

	return `/**\n${input
		.trim()
		.split("\n")
		.map((it) => ` * ${it}`)
		.join("\n")}\n */\n`;
}
