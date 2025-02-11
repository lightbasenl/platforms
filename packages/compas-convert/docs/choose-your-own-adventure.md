# Choose your own adventure

This document describes various things that are common in projects that are converted;
they are somewhat ordered in the way I think makes sense. However, it is up to you to
follow this order or choose your own adventure.

Each topic has some tasks to point you in the right direction. Some will be more detailed
than others. Do what makes sense for the project at hand.

Try to stick with a topic or domain in your code-base and finish the tasks as much as
possible. Committing the changes before going to the next tasks or domain. This allows
reviewing of individual in progress commits by peers.

It ain't easy. Try to ignore most 'unrelated'-errors while executing tasks. You'll get to
them later. Also, doing a stellar-job now results in a good working base to build-off on
later.

## Cleanup commands/generate.ts

The converter rewrote `commands/generate.js` to not be a Compas command anymore. It did so
with a bit of hacking around.

Tasks:

- Cleanup `commands/generate.ts`. In most cases things like `skipLint` can be removed,
  since the ESLint config doesn't lint `.gitignore`'d files anyway.
- Move the file to `scripts/`.
- Note the usage of `register()` in the file, it might make sense for other scripts to use
  this as well. It enhances `await import(...)` to resolve the TypeScript files as well.
  Making `tsx ./scripts/foo.ts` even more useful.

## Constants and module live bindings

Every project has constants, be it an const-object to define the available roles, or some
service which exports a constant.

Tasks:

- Using the section about `as const` and `satisfies` in
  [required readings](./required-readings.md#enums-as-const-satisfies) and go through all
  top-level `(export) {const,let}` declarations and use `as const` or `satisfies` where
  necessary.

## Domain specific types

As mentioned in [required readings](required-readings.md#query-builder-types), the new
Compas generators for TypeScript include fancy types to correctly type query results based
on the provided QueryBuilder and optional joins.

Tasks:

- Replace `QueryResultAuthUser` with one (or more) explicit types and replace all usages
  with your new type.
  - Use the arguments you gave to `backendInitServices` and the remaining default joins
    that it adds internally. Since you have
    [vendored the backend package](./vendor-backend-package.md), it might make sense to
    fully drop the `userBuilder` argument from `backendInitServices` and inline the full
    joins in a single constant.
  - See the example type below. Note the use of `satisfies` again, to get a `const` type
    of the joins, while also constraining it to the available builder type.
  - Note that this builder is used by all functions in the vendored backend package as
    well. Some might expect `passwordLogin.resetTokens` to be joined, even though they
    ain't used. You can choose to optimize this as well.
- Do the same for `QueryResultBackendTenant`.
- Do the same for any other often used used `QueryResultXyz` type.

Example user type:

```ts
export const userBuilder = {
	passwordLogin: {
		resetTokens: {},
	},
} satisfies AuthUserQueryBuilder;

// The AuthUserQueryResolver is generated.
export type ProjectUser = AuthUserQueryResolver<typeof userBuilder>;
```

## GitHub actions and documentation

You might have changed various commands, for example `npm run test` vs `npx compas test`,
or change `compas generate application` to `npm run generate`. These changes should be
reflected in your CI and documentation as well.

Tasks:

- Verify that GH actions are working as expected. Make sure `npm run build` is called as
  part of the pipelines.
- Verify that all documentation does not mention outdated commands
- In some projects error strings might refer to a command, so a global search on common
  commands like 'compas run' and 'compas migrate' might be good to execute.

## Finalization celebration

Almost there! The convert command, or you, might have added easy to resolve
`TODO(compas-convert` comments or usages of `$ConvertAny`, they must be gone. This is also
the time, to finally run through any remaining errors of `npm run build` or
`npm run lint`.

Tasks:

- Resolve the remaining issues reported by `npm run build`.
- Resolve the remaining issues reported by `npm run lint`.
- With your new experiences in hand, try to fix at least the low hanging fruit around
  `TODO(compas-convert)` and `$ConvertAny`.
