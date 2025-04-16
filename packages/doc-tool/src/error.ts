export class ConfigValidationError extends Error {
	constructor(message: string) {
		super(message);

		Object.setPrototypeOf(this, ConfigValidationError.prototype);
	}
}
