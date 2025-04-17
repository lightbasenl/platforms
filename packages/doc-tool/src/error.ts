export class ConfigValidationError extends Error {
	constructor(message: string) {
		super(message);

		Object.setPrototypeOf(this, ConfigValidationError.prototype);
	}
}

export class FileParsingError extends Error {
	public readonly filePath: string;

	constructor(message: string, filePath: string, cause?: unknown) {
		super(`Error parsing file ${filePath}: ${message}`);

		this.cause = cause;
		this.filePath = filePath;

		Object.setPrototypeOf(this, FileParsingError.prototype);
	}
}

export class FrontmatterParsingError extends Error {
	public readonly filePath: string;

	constructor(message: string, filePath: string, cause?: unknown) {
		super(`Error parsing frontmatter in file ${filePath}: ${message}`);

		this.cause = cause;
		this.filePath = filePath;

		Object.setPrototypeOf(this, FrontmatterParsingError.prototype);
	}
}
