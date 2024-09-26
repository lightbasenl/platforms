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

- Import related rules ban CommonJS style `require`'s. Check if the tool supports a
  TypeScript (`.ts`) or ESM (`.mjs`) config file. If so, try to migrate to that format.
  Not every tool supports this, so the provided config below includes various rule
  exclusions for JavaScript config files.
- Prettier is enabled with
  [`experimentalTernaries`](https://prettier.io/blog/2023/11/13/curious-ternaries). This
  reformats the ternaries. This rule is mostly auto-fixable.
- Stricter jsx-a11y setup. We have enabled the full strict config from
  eslint-plugin-jsx-a11y. Older configs only enabled a few rules. This is as good time as
  ever to improve accessibility.
- Strict checks on unused `async` keywords. This is not auto-fixed, since it might alter
  behavior. Be careful!
- The config is stricter on unused variables. They can be prefixed with a `_` to ignore.
  For example, `} catch (e) {` becomes `} catch (_e) {` or even `} catch {`. And
  `const { unused, ...rest } = obj;` becomes `const {unused: _unused, ...rest } = obj;`
- Various other rules are stricter, like checks on null-ish values and chaining those
  correctly.

The migration can be done by following these steps:

- Remove the `vendor/eslint-plugin` directory.
- Remove `.eslintrc`, `.eslintignore`, `.prettierignore` and `.prettierrc(.js)` files.
- Remove the `prettier` key from your package.json.
- Remove all existing `lint`, `format` and `pretty` scripts from your package.json.
- Add the following snippet to your package.json

```json
{
	"scripts": {
		"lint": "eslint . --fix --cache --cache-location .cache/eslint/",
		"lint:ci": "eslint ."
	},
	"devDependencies": {
		"@lightbase/eslint-config": "1.1.0",
		"@next/eslint-plugin-next": "14.2.13",
		"eslint-plugin-jsx-a11y": "6.10.0",
		"eslint-plugin-no-relative-import-paths": "1.5.5",
		"eslint-plugin-react": "7.36.1",
		"eslint-plugin-react-hooks": "beta"
	},
	"overrides": {
		"eslint": "9"
	}
}
```

- Run `npm install`
- Create `eslint.config.mjs` in the root of your project and paste the below contents.
  - Note the _.mjs_ extension.

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

	// Compatibility config overrides:
	{
		// Disable strict rules for generated files.
		files: ["**/generated/**/*"],
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unused-vars": "off",
			"unused-imports/no-unused-vars": "off",
			"@typescript-eslint/no-empty-object-type": "off",
		},
	},
	{
		// Disable various rules for CJS config files like `next.config.js` and `postcss.config.js`
		files: ["**/**.js"],
		rules: {
			"import-x/no-commonjs": "off",
			"@typescript-eslint/no-var-requires": "off",
			"@typescript-eslint/no-require-imports": "off",
		},
	},

	// Optional: you can add new rules here, like the following
	// {
	// 	// Don't lint the big files
	// 	files: ["**/__fixtures__//**/*.json"],
	// 	rules: {
	// 		"format/prettier": "off",
	// 	},
	// },
);
```

- Update your `tsconfig.json` to type-check JavaScript files as well.

```json
{
	"include": ["**/*", "**/.*", ".next/types/**/*.ts"]
}
```

- Disable linting on `next builds`. We do this separately in CI, so no need to do this
  twice.

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

- Apply the [IDE](./README.md#ide) section from the README.
- Update your CI workflows to use the `npm run lint:ci` command.
- Create a commit with all the config changes. So these can be reviewed separately.
- Run `npm run lint` and commit the changes. This way colleagues can skip reviewing the
  automated fixes.
- Fixup any reported errors that need manual fixing and do the final commit.
