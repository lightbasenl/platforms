# Required readings

There are some things you just need to know before attempting the conversion.

## Vitest

[Vitest](https://vitest.dev/) is a modern test-framework. Decently fast. It has various
IDE integrations. The way we setup 'global'-services and how they are handled in tests,
doesn't full map to Vitest test isolation. Resulting in a slow-ish experience with full
re-setup of all services for all test suites.

There will be more material and tips later on to improve the setup to be more Vitest
native.

## TSX

[TSX](https://github.com/privatenumber/tsx) is an `npx` or `node` wrapper which
automatically transpiles TypeScript. This is used in development to import `gen/*.ts`
files while generating for example. Projects can alternatively use
[Jiti](https://github.com/unjs/jiti) or use Node.js built-in
[type-stripping](https://nodejs.org/docs/latest/api/typescript.html#type-stripping). The
last one can especially be great with the new
[`erasableSyntaxOnly`](https://github.com/microsoft/TypeScript/issues/59601) option of
TypeScript 5.8 (beta at the time of writing).

## TypeScript in general

We use all the strict-features of TypeScript, it might make sense for your project to
disable a few to start with. But as a general rule, the stricter the better. Which should
be possible, provided that the picked libraries are type-aware as well. Compas might
generate empty types `export type Foo = {}`, this is not ideal. Read up on why that is :).

## Any usage

This project uses `$ConvertAny` and `TODO(compas-convert)` extensively. It is advised to
align with this when migrating the project. After the migration, it should be the goal to
clean these things up as soon as possible.

## Query builder types

Compas generates various types related to the `queryXyz` functions. These are helpers to
get a typed result. Current code mostly uses `QueryResultAuthUser` for example, which
doesn't specify any joins. So there is knowledge or research required to find out what is
joined and what isn't. The potentially joined properties are then typed as
`undefined|string|SomeJoinedResult`. It is advised to refactor those types to something
like

```ts
type AdminUser = DatabaseUserQueryResolver<{
	roles: unknown;
	adminSettings: {
		profilePicture: unknown;
	};
}>;
```

This way, you can use the `AdminUser` type instead of `QueryResultAuthUser`. This also
supports optional joins. Those will be handled in later docs.

## Error handling and other utilities

Use [@lightbase/utils](https://www.npmjs.com/package/@lightbase/utils) for type-aware
things like `isNil`. It also has branch-less error cases like `assertNotNil`.

In general, we can improve error handling a bit, using things like invariants more. Also
checkout the types that package provides.

## Git Worktree

This project creates a new [Git Worktree](https://git-scm.com/docs/git-worktree). This
allows you to have multiple checkouts for the same projects. See the linked docs for
information on how to clean that up eventually.
