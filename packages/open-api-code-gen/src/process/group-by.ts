import type { GeneratorTargetOutput } from "../config/target.js";
import type { PathItem } from "../utils/openapi.js";

export function groupPathItems(
	pathItems: Array<PathItem>,
	groupBy: GeneratorTargetOutput["groupBy"],
): Record<string, Array<PathItem>> {
	const result: Record<string, Array<PathItem>> = {};
	const groupByFn = makeGroupBy(groupBy);

	for (const item of pathItems) {
		const group = groupByFn(item);
		if (result[group]) {
			result[group].push(item);
		} else {
			result[group] = [item];
		}
	}

	return result;
}

function makeGroupBy(
	input: GeneratorTargetOutput["groupBy"],
): (item: PathItem) => string {
	if (typeof input === "function") {
		return (item) => input(item.pathItem);
	}

	if (input.by === "tag") {
		return (item) => item.pathItem.tags?.[0] ?? input.defaultGroup;
	}

	if (input.by === "path-prefix") {
		return (item) =>
			item.path
				.split("/")
				.filter((it) => !!it)
				.pop() ?? input.defaultGroup;
	}

	throw new Error("Unreachable!");
}
