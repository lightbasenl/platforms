# Initial steps

This document describes the initial steps to execute the conversion.

1. Make sure that you have a clean, up-to-date checkout of the repository.
2. Align with your team on how this is executed. Is there a feature-freeze for example?
3. Clone this repository and open a terminal in the repository root.
4. Run the following commands `npm install && npm run build:ws`
5. Run the converter via
   `npx compas-convert ../path-to-project ../some-non-existent-output-path`.
6. Wait please :) The tool takes some time to:
   - Initialize a git worktree
   - Copy and rename (almost) all the files
   - Add a tsconfig, and some related dependencies
   - Install the dependencies
   - Various conversions like:
     - Importing some commonly used types like `InsightEvent`
     - Rewrite `commands/generate.js` and adding the scripts to the package.json
     - Convert all kinds of JSDoc blocks to TypeScript type-annotations.
     - Converts from the Compas test runner to Vitest
     - Adds various not-nil and `AppError` assertions in test files.
7. Add the snippet further down this page to your `eslint.config.js`.
8. Update the `Dockerfile`, if necessary to use the `dist/` directory. Make sure to copy
   over other assets from the root of the project as well like `config/tenants.json`.

## Snippet for eslint.config.js

```ts
import { defineConfig } from "@lightbase/eslint-config";

export default defineConfig(
	{
		// ...
	},
	{
		files: ["**/**"],
		rules: {
			// TODO(compas-convert): enable these rules again.
			"@typescript-eslint/no-unsafe-assignment": "off",
			"@typescript-eslint/no-unsafe-member-access": "off",
			"@typescript-eslint/no-unsafe-argument": "off",
			"@typescript-eslint/no-unsafe-call": "off",
			"@typescript-eslint/no-unsafe-return": "off",
			"unused-imports/no-unused-vars": "off",
		},
	},
);
```
