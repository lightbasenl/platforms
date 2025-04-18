/**
 * Check if the provided value is null|undefined.
 */
export function isNil(value: unknown): value is null | undefined {
	return value === null || value === undefined;
}

/**
 * Check if the provided value is an object-like
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Check if the provided value is an object-like with the provided keys
 */
export function isRecordWith<const T extends Array<string>>(
	value: unknown,
	keys: T,
): value is Record<T[number] & string, unknown> {
	return isRecord(value) && keys.every((key) => Object.hasOwn(value, key));
}
