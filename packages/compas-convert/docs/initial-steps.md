# Initial steps

This document describes the initial steps to execute the conversion.

1. Make sure that you have a clean, up-to-date checkout of the repository.
2. Align with your team on how this is executed. Is there a feature-freeze for example?
3. Clone this repository and open a terminal in this repository root.
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
     - Tries to add missing imports due to dropping the `declareGlobalTypes` option from
       Compas generate calls.
7. Open up the project in your IDE
   - Configure things the TypeScript language server and other stuff you'd like.
8. Add the snippet further down this page to your `eslint.config.js`.
9. Update the `Dockerfile`. Make sure to copy over other assets from the root of the
   project as well like `config/tenants.json` and migration files. Depending on how you
   set this up, you might need to add a TODO to change the container commands in your
   infrastructure config to be updated to reflect these changes.
10. Run ESLint for the first time via `npm run lint`. Ignore all errors for now.
11. Stage and commit all files. Double check that `dist/` is in your `.gitignore`. Open a
    WIP pull request with at least the following contents:
    - Point to the docs of this repository.
12. Progress to [choose your own adventure](./choose-your-own-adventure.md). In general,
    commit often. Leave behind a trail of `TODO(compas-convert)` when it makes sense, and
    use `$ConvertAny` where it makes sense.

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

## Example Dockerfile

A pretty unoptimized Dockerfile.

```Dockerfile
FROM node:22-alpine as deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN npm run generate
RUN npm run build:emit
RUN npm install --omit=dev

FROM node:22-alpine

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/dist .

# Copy over necessary assets, which are not included in `dist/`.
COPY ./config .
COPY ./migrations .

# Setup Sentry release variable to be based on the current commit sha.
ARG COMMIT_SHA
ENV SENTRY_RELEASE=$COMMIT_SHA
```
