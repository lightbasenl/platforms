import type { PathItem } from "../utils/openapi.js";

export function descriptionToDocBlock(input?: string) {
	if (!input) {
		return "";
	}

	return `/**${input
		.split("\n")
		.map((it) => ` * ${it}`)
		.join("\n")}\n */\n`;
}

export function resolveDefaultOperationId(input: PathItem) {
	if (input.pathItem.operationId) {
		return input.pathItem.operationId;
	}

	return lowerCaseFirst(
		(input.method + input.path)
			.split("/")
			.map((it) => slugifyString(it))
			.map((it) => upperCaseFirst(it))
			.join(""),
	);
}

export function slugifyString(input: string) {
	return input.replaceAll(/\W/gi, "");
}

export function upperCaseFirst(input: string) {
	if (input.length === 0) {
		return "";
	}

	return (input[0] ?? "").toUpperCase() + input.slice(1);
}

export function lowerCaseFirst(input: string) {
	if (input.length === 0) {
		return "";
	}
	return (input[0] ?? "").toLowerCase() + input.slice(1);
}

export function trimRouteParam(input: string) {
	const chars = input.split("");
	while (chars.includes("{") && chars.includes("}")) {
		const start = chars.indexOf("{");
		const end = chars.indexOf("}", start);

		if (start === -1 || end === -1) {
			break;
		}

		chars.splice(start, end, ...chars.slice(start + 1, end - 1));
	}

	return chars.join("");
}
