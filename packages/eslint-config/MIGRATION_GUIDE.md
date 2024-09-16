# Migrating to @lightbase/eslint-config

> [!NOTE]
>
> In most cases, you may need to remove 'node_modules' and 'package-lock.json' and
> reinstall the packages after the below installation steps. This drops existing version
> constraints that exist in the resolved packages, allowing NPM to re-resolve everything.

## From @compas/eslint-plugin

Execute the following steps to migrate in a mostly compatible way from
`@compas/eslint-plugin` to this package. The main incompatibilities are:

- Prefer `Array<string>` types in JSDoc over `string[]` syntax in JSDoc. Most instances of
  this can be autofixed. Various nested JSDoc blocks might need manual fixing.
- Renamed rules like `@compas/event-stop` to `@lightbase/compas-event-stop`.

The migration can be done as follows:

- Remove the `@compas/eslint-plugin` dependency from your package.json.
- Install this package with `npm install --save-dev --exact @lightbase/eslint-config`
- Remove `.eslintrc`, `.eslintignore`, `.prettierignore` and `.prettierrc(.js)` files.
- Remove the `prettier` key from your package.json.
- Remove all existing `lint`, `format` and `pretty` scripts from your package.json.
- Create `eslint.config.js` in the root of your project and paste the below contents.

```js
// eslint.config.js
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

- Apply the [Commands](./README.md#commands) section from the README.
- Apply the [IDE](./README.md#ide) section from the README.
- Run `npm run lint`
- Commit and open a pull request. Afterward, fixup any left-over errors (don't
  force-push). This way, manual fixes can be reviewed properly.
- Update your CI scripts to use the `npm run lint:ci` command.

## From (internal) @lightbase/eslint-plugin

In these steps we will be removing the vendored eslint-plugin and use
`@lightbase/eslint-config` instead. The result should give almost the same experience as
before. The main incompatibilities are:

- Import related rules ban CommonJS style `require`'s. Check if the tool supports `.mjs`
  config files or add file specific ignores. The provided config below includes an
  exclusion already fro `**.js` files.
- Prettier is enabled with
  [`experimentalTernaries`](https://prettier.io/blog/2023/11/13/curious-ternaries). This
  reformats the ternaries, but this is always auto-fixed.
- Stricter jsx-a11y setup. We have enabled the full strict config from
  eslint-plugin-jsx-a11y. Older configs only enabled a few rules. This is as good time as
  ever to improve the accessibility.
- Strict checks on unused `async` keywords. This is not auto-fixed, since it might alter
  behavior. Be careful.
- The config is stricter on unused variables. They can be prefixed with a `_` to ignore.
  For example, `} catch (e) {` becomes `} catch (_e) {` or even `} catch {`. And
  `const { unused, ...rest } = obj;` becomes `const {unused: _unused, ...rest } = obj;`
- Various other rules are stricter, like checks on null-ish values and chaining those
  correctly.

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

```js
// eslint.config.mjs
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

**Stricter checks around nullish variables**

```
// Not allowed, template-literals are never nullish
const x = `${foo?.bar}` ?? "";
```
