import type { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
// @ts-expect-error no type defs
import pluginJSXA11y from "eslint-plugin-jsx-a11y";
// @ts-expect-error no type defs
import pluginNoRelativeImportPaths from "eslint-plugin-no-relative-import-paths";
import pluginReact from "eslint-plugin-react";
// @ts-expect-error no type defs
import pluginReactHooks from "eslint-plugin-react-hooks";
import { GLOBS, globUse } from "./globs.js";

export type ReactConfig = {
	withNextJs?: boolean;
};

export async function react(config: ReactConfig): Promise<Array<FlatConfig.Config>> {
	// Only expect the Next.js plugin if explicitly enabled. At some point we might infer this based
	// on the existence of the `next.config.js` file?
	const pluginNext =
		config.withNextJs ?
			(
				(await import(
					// @ts-expect-error no types available
					"@next/eslint-plugin-next"
				)) as unknown as { default: FlatConfig.Plugin }
			).default
		:	undefined;

	return [
		...(pluginNext ?
			([
				{
					// Next.js configuration
					files: globUse([GLOBS.typescript]),
					plugins: {
						"@next/next": pluginNext,
					},
					rules: {
						...(pluginNext.configs?.recommended?.rules as Record<string, string>),
						...(pluginNext.configs?.["core-web-vitals"]?.rules as Record<string, string>),

						"@next/next/no-img-element": "off",
					},
				},
			] satisfies Array<FlatConfig.Config>)
		:	[]),

		{
			// React, React-hooks and JSX a11y rules.
			files: globUse([GLOBS.typescript]),
			plugins: {
				"react": pluginReact as unknown as FlatConfig.Plugin,
				"react-hooks": pluginReactHooks as FlatConfig.Plugin,
				"jsx-a11y": pluginJSXA11y as FlatConfig.Plugin,
			},
			settings: {
				react: {
					version: "detect",
				},
			},
			rules: {
				...((pluginReact as unknown as FlatConfig.Plugin).configs?.recommended
					?.rules as Record<string, string>),

				// Good practices
				"react/iframe-missing-sandbox": "error",
				"react/jsx-no-script-url": "error",

				"react/react-in-jsx-scope": "off",
				"react/prop-types": "off",

				...((pluginJSXA11y as FlatConfig.Plugin).configs?.strict?.rules as Record<
					string,
					string
				>),

				"react-hooks/rules-of-hooks": "error",
				"react-hooks/exhaustive-deps": "error",
			},
		},

		{
			// TODO: revert this!

			// Disable no-deprecated in React projects. For some reason, this rule takes 2+ minutes on a
			// mid-sized project. We should investigate soon why that is.
			files: globUse([GLOBS.typescript]),
			rules: {
				"@typescript-eslint/no-deprecated": "off",
			},
		},

		{
			// Custom import ordering preferences by our frontenders :^)
			files: globUse([GLOBS.typescript]),
			plugins: {
				"no-relative-import-paths": pluginNoRelativeImportPaths as FlatConfig.Plugin,
			},
			rules: {
				"import-x/order": [
					"error",
					{
						"warnOnUnassignedImports": false,
						"newlines-between": "always",
						"alphabetize": {
							order: "asc",
						},
						"groups": [
							"type",
							"builtin",
							"external",
							"internal",
							"parent",
							"sibling",
							"index",
							"object",
						],
						"pathGroups": [
							{
								pattern: "css/**",
								group: "builtin",
								position: "before",
							},
							{
								pattern: "react",
								group: "builtin",
								position: "before",
							},
							{
								pattern: "next/**",
								group: "builtin",
								position: "before",
							},
							{
								pattern: "generated/**",
								group: "internal",
								position: "before",
							},
							{
								pattern: "lib/**",
								group: "internal",
								position: "before",
							},
							{
								pattern: "cms/**",
								group: "internal",
								position: "before",
							},
							{
								pattern: "server/**",
								group: "internal",
								position: "before",
							},
							{
								pattern: "tenants/**",
								group: "internal",
								position: "before",
							},
							{
								pattern: "pages/**",
								group: "internal",
								position: "before",
							},
							{
								pattern: "hooks/**",
								group: "internal",
								position: "before",
							},
							{
								pattern: "components/**",
								group: "internal",
								position: "before",
							},
							{
								pattern: "{assets,locale}/**",
								group: "internal",
							},
						],
						"pathGroupsExcludedImportTypes": ["react", "next/**", "css/**"],
					},
				],

				"no-relative-import-paths/no-relative-import-paths": [
					"error",
					{ allowSameFolder: true, rootDir: "src" },
				],
			},
		},
	];
}
