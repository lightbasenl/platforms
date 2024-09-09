export function isNil(value: unknown): value is null | undefined {
	return value === null || value === undefined;
}

export function isUnknownRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && !isNil(value);
}

export function objectWithKey<const K extends string>(
	value: unknown,
	key: K,
): value is Record<K, unknown> {
	return isUnknownRecord(value) && key in value;
}
