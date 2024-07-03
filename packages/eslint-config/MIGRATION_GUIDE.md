# Migrating to @lightbase/eslint-config

## From @compas/eslint-plugin

Execute the following steps to migrate in a mostly compatible way from
`@compas/eslint-plugin` to this package. The main incompatibilities are:

- Prefer `Array<>` types in JSDoc over `[]` types.
- Renamed rules like `@compas/event-stop` to `@lightbase/compas-event-stop`.

The migration can be done as follows:

- Remove the `@compas/eslint-plugin` dependency from your package.json.
- Install this package with `npm install --save-dev --exact @lightbase/eslint-config`
- Remove `.eslintrc`, `.eslintignore`, `.prettierignore` and `.prettierrc(.js)` files.
- Remove the `prettier` key from your package.json.
- Remove all existing `lint`, `format` and `pretty` scripts from your package.json.
- Create `eslint.config.js` in the root of your project and paste the below contents.
- Apply the [Commands](./README.md#commands) section from the README.
- Apply the [IDE](./README.md#ide) section from the README.
- Run `npm run lint`
- Commit and open a pull request. Afterward, fixup any left-over errors (don't
  force-push). This way, manual fixes can be reviewed properly.
- Update your CI scripts to use the `npm run lint:ci` command.

```js
import { defineConfig } from "@lightbase/eslint-config";

export default defineConfig(
	{
		prettier: {
			globalOverride: {
				useTabs: false,
				printWidth: 80,
			},
		},
	},
	{
		ignores: ["**/*.d.ts"],
	},
);
```

### Common issues

**JSDoc array syntax**

The new config prefers `Array<string>` over `string[]` in JSDoc comments. Auto-fixers are
able to fix most occurrences. However, a few of them have to be fixed by hand.

## From (internal) @lightbase/eslint-plugin

In these steps we will be removing the vendored eslint-plugin and use
`@lightbase/eslint-config` instead. The result should give almost the same experience as
before. The main incompatibilities are:

- Import related rules ban CommonJS style `require`'s. Check if the tool supports `.mjs`
  config files or add file specific ignores.
- Prettier is enabled with
  [`experimentalTernaries`](https://prettier.io/blog/2023/11/13/curious-ternaries)

The migration can be done by following these steps:

- Remove the `vendor/eslint-plugin` directory.
- Install this package with `npm install --save-dev --exact @lightbase/eslint-config`
  - Install the React & Next.js related peer dependencies with
    `npm install --save-dev --exact eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y eslint-plugin-no-relative-import-paths @next/eslint-plugin-next`
  - Note, the NPM may keep an old installed version around like ESLint v8.51. You can
    override this by either removing the `package-lock.json` and `node_modules` and
    reinstalling. Or by explicitly installing ESLint with
    `npm install --save-dev --exact eslint`.
- Remove `.eslintrc`, `.eslintignore`, `.prettierignore` and `.prettierrc(.js)` files.
- Remove the `prettier` key from your package.json.
- Remove all existing `lint`, `format` and `pretty` scripts from your package.json.
- Create `eslint.config.mjs` in the root of your project and paste the below contents.
  - Note the _.mjs_ extension.
- Apply the [Commands](./README.md#commands) section from the README.
- Apply the [IDE](./README.md#ide) section from the README.
- Run `npm run lint`
- Commit and open a pull request. Afterward, fixup any left-over errors (don't
  force-push). This way, manual fixes can be reviewed properly.
- Update your CI scripts to use the `npm run lint:ci` command.

Since we execute the lint check separately on CI, we can instruct Next.js to skip linting
before building:

```js
// next.config.js
module.exports = {
	// ... config

	eslint: {
		// We run lint separately before building.
		ignoreDuringBuilds: true,
	},
};
```

```js
import { defineConfig } from "@lightbase/eslint-config";

export default defineConfig(
	{
		prettier: {
			// Backwards compatibility
			globalOverride: {
				printWidth: 110,
				useTabs: false,
				arrowParens: "avoid",
			},
		},
		typescript: {
			// TODO: Start enabling some type check rules. See https://typescript-eslint.io/users/configs/#recommended-type-checked
			// Note that we plan on enabling these rules one by one in upcoming releases even if this
			// setting is set to true. See https://github.com/lightbasenl/platforms/issues/133
			disableTypeCheckedRules: true,
		},
		react: {
			withNextJs: true,
		},
	},
	{
		// Disable strict rules for generated files.
		files: ["**/generated/**/*.*"],
		rules: {
			"@typescript-eslint/ban-types": "off",
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unused-vars": "off",
			"unused-imports/no-unused-vars": "off",
		},
	},
	{
		// Disable various rules for CJS config files like `next.config.js` and `postcss.config.js`
		files: ["**.js"],
		rules: {
			"import-x/no-commonjs": "off",
			"@typescript-eslint/no-var-requires": "off",
		},
	},
);
```

### Common issues

**JSX-A11y rules**

We’ve enabled `eslint-plugin-jsx-a11y` in full strict mode. Older configs only enabled a
few of the provided rules. This is as good time as ever to make everything more
accessible.

**Unused `async` keyword**

The config errors on functions that are marked `async` without having an `await`. Note
that this may implicitly alter behavior, so be careful when removing the keyword.

**Unused variables**

The config is strict on unused variables. Either remove the variable or prepend with a
`_`. Some common cases:

- `catch` blocks that don't use the captured error

```ts
try {
	// ...
} catch {
	// Skipped capturing the error
}
```

- Destructuring an object to remove a variable

```ts
const x = {
	a: true,
	b: false,
	c: true,
};

// _b is allowed
const { b: _b, ...rest } = x;

somethingWithRest(rest);
```

**Stricter checks around nullish variables**

```
// Not allowed, template-literals are never nullish
const x = `${foo?.bar}` ?? "";
```
