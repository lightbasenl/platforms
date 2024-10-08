import type { OpenAPIV3 } from "openapi-types";

type TargetSharedOptions = {
	/**
	 * Output directory relative to the project root.
	 */
	outputDirectory: string;

	/**
	 * Howto group resources in to different groups.
	 */
	groupBy?: TargetGroupBy;

	/**
	 * Lock this generator. This means that output for existing routes will still be updated,
	 * but new routes will be generated by the next target.
	 */
	locked?: boolean;
};

type TargetCompasWeb = TargetSharedOptions & {
	/**
	 * Compas compatible types, Axios, and RQ wrapper with Web types
	 */
	target: "compas-compat-web";
};

type TargetCompasReactNative = TargetSharedOptions & {
	/**
	 * Compas compatible types, Axios, and RQ wrapper with RN types
	 */
	target: "compas-compat-rn";
};

type TargetGroupBy =
	| {
			by: "tag";
			defaultGroup: string;
	  }
	| {
			by: "path-prefix";
			defaultGroup: string;
	  }
	| ((resource: OpenAPIV3.OperationObject) => string);

export type GeneratorTarget = TargetCompasWeb | TargetCompasReactNative;
export type GeneratorTargetOutput = Required<GeneratorTarget>;

export function targetDefaults(target: GeneratorTarget): GeneratorTargetOutput {
	return {
		target: target.target,
		locked: target.locked ?? false,
		groupBy: target.groupBy ?? { by: "tag", defaultGroup: "uncategorized" },
		outputDirectory: target.outputDirectory,
	};
}
