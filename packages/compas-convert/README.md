# Compas convert

Convert Compas code-bases to TypeScript and beyond.

## Context

We want to migrate all active projects to TypeScript. Allowing us to use migrate to
TypeScript powered libraries like Zod and Drizzle ORM to replace Compas.

## Goals

- Backwards compatibility; everything runs in production. We should be able to push the
  output of this tool, feature-freeze for a week to execute manual testing and then use
  our normal processes like nothing happened.
- Completeness; we would rather spend a few extra weeks polishing the output of this tool,
  than to have to do that work later across all projects manually.
- DX; the developer experience on the converted projects should be better or the same. For
  example, including the migration to Vitest in this tool will enable us to finally have
  IDE support for tests in our projects.
- Source-to-source; we will only change things in the project structure if it makes sense
  for the new tools.
- One-time only; this tool will be developed for a one-time migration of all projects.
  Afterward, we will remove it. The project will never be published to a registry like
  NPM.

## Usage

```shell
# From the repository root
npm run build:ws
npx compas-convert ../input/directory ../output/directory

# For active development on this tool you probably want the following from the repository root.
# Enable TS watch mode in your IDE.
rm -rf ../compas-convert-test && npx compas-convert ../some-local-test-project ../compas-convert-test && open ../compas-convert-test
```

## TODO

- [ ] ~Fully implement the 'compas-compat' target in
      [open-api-code-gen](../open-api-code-gen).~ Most likely not necessary, we can keep
      the exposed structure as is for now.
- [x] Pass: Generator compatibility. Create / improve Compas Typescript targets for
      tighter integrations.
  - [x] Types
  - [x] Validators
  - [x] Router
  - [x] Database
- [x] Pass: @compas/test to Vitest
- [x] Pass: inline JSDoc blocks to inline types
- Pass: Run TypeScript, ESLint and tests to find common errors
  - [x] Type of `AppErrror` in Compas should accept anything for 'cause' and 'info'.
    - `TS2345: Argument of type 'unknown' is not assignable to parameter of type 'Error | undefined'`
    - Used in all variants of `AppError` construction
  - [x] Insert `assertIsAppError` in test files
    - On `TS18046: 'e' is of type 'unknown'`
    - AND `.key` or `.info` is accessed
    - Implement like `not-nil-checks-in-test-flows`
  - [x] Convert JSDOC `function(number, string): string` to `(number, string) => string`
        (only 16 occurrences in codebase, maybe not worth it)
- [x] Pass: query-builder types
  - Improve query-builder types by inferring the types based on the passed in builder.

Checklist:

- [x] Any TS errors we need to fix still?
  - Start documenting common errors and their fixes below
  - [x] CRUD file errors add `@ts-nocheck` or comparable.
  - [x] Check on generated input/output types for things like `ctx.body`
  - [x] Add `@lightbase/utils` package, and use that for `assertNotNil`.
  - [x] Verify that all maintained projects at least convert.
- [x] Any ESLint rules we can fix?
  - Start documenting common errors and their fixes below
- [x] Can we run the API, Queue, etc?
- [x] Does the docker build work?
  - Copy dist + copy any necessary static files.
  - Run from the dist.

## Migration docs

Prerequisites:

- [Include the vendor/backend package](./docs/vendor-backend-package.md)
- [Read-up on some required reading](./docs/required-readings.md)

Executing the migration:

- [Initial steps](./docs/initial-steps.md)
- [Choose your own adventure](./docs/choose-your-own-adventure.md)

---

Random stuff:

- Uses of `t` in test files are replaced with `{ log: newLogger() }`. In most cases, this
  should suffice for the use case.
