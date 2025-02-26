# Choose your own adventure

This document describes various things that are common in projects that are converted;
they are somewhat ordered in the way I think makes sense. However, it is up to you to
follow this order or choose your own adventure.

Each topic has some tasks to point you in the right direction. Some will be more detailed
than others. Do what makes sense for the project at hand.

Try to stick with a topic or domain in your code-base and finish the tasks as much as
possible. Committing the changes before going to the next tasks or domain. This allows
reviewing of individual in progress commits by peers.

Prevent refactoring too much. The migration is big enough as is. Leave a TODO comment and
move on.

Converting in one go ain't a small feat. Try to ignore most 'unrelated'-errors while
executing tasks. You'll get to them later. Also, doing a stellar job now results in a good
working base to build-off on later.

## Add different type packages

Some packages don't include typings (yet)...

Tasks:

- Add the below snippet to your `devDependencies`. You might come across more dependencies
  as you go.

```json
{
	"@types/bcrypt": "5.0.2",
	"@types/mjml": "4.7.4",
	"@types/nodemailer": "6.4.17",
	"@types/nodemailer-html-to-text": "3.1.3"
}
```

## Cleanup commands/generate.ts

The converter rewrote `commands/generate.js` to not be a Compas command anymore. It did so
with a bit of hacking around. It also created npm-scripts in your `package.json` to
execute the different generators you might have.

Tasks:

- Cleanup `commands/generate.ts`. In most cases things like `skipLint` can be removed,
  since the ESLint config doesn't lint `.gitignore`'d files anyway.
- Move the file to `scripts/`.
- Note the usage of `register()` in the file, it might make sense for other scripts to use
  this as well. It enhances `await import(...)` to resolve the TypeScript files as well.
  Making `tsx ./scripts/foo.ts` even more useful.
- Use `Generator` instead of `App` in `gen/` files. `App` is an old import, which doesn't
  seem to be reflected yet in the JSDocs of all projects.
- If `T.any().implementations` is used, make sure to supply the `ts` implementation.
- If you don't use the ERD much in the project README, now might be the time to clean it
  up. You could still generate it by keeping the `database.includeEntityDiagram` option.
  It will then reside in the `$generated/common` directory.

## As you-go

Various common statements like `const [user] = await queryUser().exec(sql);` mark the
`user` variable as `User|undefined`. This is the correct type, since there may not always
be a returned row. However, in cases like insert queries or update queries with
`returning` on specific entities, you can be 99% sure that the values exist.

In these cases you can use `assertNotNil` from the `@lightbase/utils` package.

```ts
// For some statements you can be 99.99% sure that they are never hit. Here you can use it with
// just the variable in question;
assertNotNil(user);

// In other cases, you might want to customize the error message:
assertNotNil(user, AppError.serverError, {
	message: "User should really be available here!",
});
```

Alternatively, it might make sense to cast to a tuple

```ts
// We are 100% sure to get a user here, so cast as a tuple with length '1'.
const [{ passwordLogin }] = (await queryUser({
	where: { id: user.id },
}).exec(sql)) as [AuthUser];
```

Tasks:

- As you go, use `assertNotNil` when necessary. Make sure to annotate with explicit errors
  if the statement may fail.

## Constants and module live bindings

Every project has constants, be it a const-object to define the available roles, or some
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
  - Use the arguments for `userBuilder` you gave to `backendInitServices` and the
    remaining default joins that it adds internally. Since you have
    [vendored the backend package](./vendor-backend-package.md), it might make sense to
    fully drop the `userBuilder` argument from `backendInitServices` and inline the full
    joins in a single constant.
  - See the example type below. Note the use of `satisfies` again, to get a `const` type
    of the joins, while also constraining it to the available builder type.
  - Note that this builder is used by all functions in the vendored backend package as
    well. Some might expect `passwordLogin.resetTokens` to be joined, even though they
    ain't used. You can choose to optimize this as well.
- Do the same for `QueryResultBackendTenant`.
- Do the same for any other often used `QueryResultXyz` type.

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

In some functions you only use specific properties of the full entity; in those cases you
might want to use the `Pick` type-utility or use the `select` property on a query builder
(which `QueryResolver`'s take into account).

For example, many functions only use the `.id` property. It might make sense to create a
`UserId` type which only has `{ id: string }` or `Pick<AuthUser, "id">`. For a fully
type-safe solution, 'branded' types is the way to go here, see the docs of
`@lightbase/utils` on this one.

## Tests

Most of the test files are converted automatically to use Vitest' APIs. The setup that we
use in most projects with the global services, which are then reused across suites is
however not the fastest way to work with Vitest. So at some point you might want to more
explicitly load only the necessary services for a test in a `beforeAll` hook for example.

The main incompatibility between the Compas test-runner and Vitest is around when subtests
are initialized. Compas only ran `t.test` after the previous `t.test` when executing.
Going top to bottom through a file, depth-first through a top-level suite. Running
registered sub-tests _after_ the full parent callback was finished.

Vitest on the other hand uses `describe` blocks, which are immediately executed to collect
all hooks and `test` calls (`beforeEach`, `beforeAll`, etc). Even recursively. This means
that scoped initialization is executed too early.

Via Compas, this logs `1, 2, 3, 4`

```ts
/* eslint-disable no-console */
test("foo", (t) => {
	console.log("log: 1");

	t.test("bar", () => {
		console.log("log 2");
	});

	t.test("quix", (t) => {
		console.log("log 3");

		t.test("fox", () => {
			console.log("log 4");
		});
	});
});
```

Via Vitest, this logs `1, 3, 2, 4`

```ts
/* eslint-disable no-console */
describe("foo", (t) => {
	console.log("log: 1");

	test("bar", () => {
		console.log("log 2");
	});

	describe("quix", (t) => {
		console.log("log 3");

		t.test("fox", () => {
			console.log("log 4");
		});
	});
});
```

Another issue is around circular imports. In some cases, Vite won't initialize these
properly, so specific test cases may fail. Here, you have to find out why the circular
import happened and either move things around or use ad dynamic import instead.

Tasks:

- Fix any too early executing statement in `describe` blocks by using a `beforeAll`. You
  might need to introduce a `let` variable in the `describe` scope, and add
  `assertNotNil`'s later on.

## Pre-finalization

There are a bunch of things not mentioned, that you may need to do. For example:

The JSDoc was incorrect. Either missing, incorrectly formatted or the wrong type was used.
Add the correct type annotations. Also note that in many cases Compas generates an
`FooBar` and `FooBarInput`. The latter being the validator input type, which allows for
example string inputs for `T.date()` validators, which it converts internally.

Adding explicit generics when creating things like `new Set<string>()` or
`new Map<string, number>()`.

Transforming an entity to a response which uses the `delete` operator. It works better to
just manually map the full thing, i.e `{ id: entity.id, propX: entity.propX }`.

Incorrect return-types. Returning something like `Promise<QueryResultFooBar>` is often
incorrect if the builder-type is inferred. In some cases, you want to explicitly add the
correct return type, in others its fine to let TypeScript just infer the return type.

Invalid `ctx` typings. When passing `ctx` to `fileSendResponse`, use
`as unknown as Context` importing `Context` from Koa. In other scenario's
`Context & { log: Logger, event: InsightEvent }` might be appropriate. See the below
snippet for globally augmenting the `koa.Context` type. This also allows typing the
session information, so in vendored backend code, you can use
`const _ctx = ctx as unknown as Context;` and `_ctx[sessionStoreObjectSymbol]`

Doing arithmetic or logical expressions with `Date` objects. An explicit `.getTime()` call
is necessary.

Checks on `typeof sql.savepoint === "function"` give a type-error. Use something like
`typeof (sql as TransactionSql).savepoint === "function"`. Later on, you might want to use
explicit `Postgres` and `TransactionSql` types when needed.

Tasks:

- Go through each file and fix these things. It makes sense to go by domain, starting with
  'isolated' (or less-business heavy) domains.

```ts
// Globally augments the Koa context type.

declare module "koa" {
	interface DefaultContext {
		[sessionStoreObjectSymbol]: StoreSessionStore;
		session: AuthSession;
		event: InsightEvent;
		log: Logger;
	}
}
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
- For Lightbase colleagues, see the setup of sourcemap uploads to Sentry in the first
  converted project.

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
