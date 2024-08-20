# ESLint config

Opinionated but configurable ESLint config. Fully includes linting and formatting.

## Install

```shell
npm install --save-dev --exact @lightbase/eslint-config
```

Some configurations require manually installed plugins. For example

```shell
npm install --save-dev --exact eslint-plugin-react eslint-plugin-react-hooks
```

This is documented below.

## Usage

This package builds a config, compatible with
[ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files-new).
To use the config, create the following `eslint.config.js` file:

```js
import { defineConfig } from "@lightbase/eslint-config";

export default defineConfig({});
```

### Commands

Add the following scripts to your `package.json`:

```json
{
	"scripts": {
		"lint": "eslint . --fix --cache --cache-location .cache/eslint/",
		"lint:ci": "eslint ."
	}
}
```

> Make sure to add `.cache` to your .gitignore

> > [!NOTE]
>
> In a CommonJS project, make sure to name your file `eslint.config.mjs` instead.

## Default configuration and options

### Prettier

Prettier is configured to run on all markdown, json, yaml, JavaScript and TypeScript
files. We support the following configuration to override this:

```js
import { defineConfig } from "@lightbase/eslint-config";

export default defineConfig({
	prettier: {
		globalOverride: {
			// Override Prettier options for all supported files.
		},
		languageOverrides: {
			ts: {
				// Override Prettier options for a specific file
				// group.
			},
		},
	},
});
```

### Typescript

[Typescript ESLint](http://typescript-eslint.io/) is automatically enabled if a
`tsconfig.json` is present.

```js
import { defineConfig } from "@lightbase/eslint-config";

export default defineConfig(
	{},
	{
		// Apply custom rules
		files: ["**/*.ts"],
		rules: {
			"@typescript-eslint/no-unused-vars": "off",
		},
	},
);
```

Or explicitly disabling Typescript support can be done with:

```js
import { defineConfig } from "@lightbase/eslint-config";

export default defineConfig({
	typescript: false,
});
```

By default, we enable the recommended type checked rules from typescript-eslint. To
disable these rules, use:

```js
import { defineConfig } from "@lightbase/eslint-config";

export default defineConfig({
	typescript: {
		disableTypeCheckedRules: true,
	},
});
```

### Markdown

A Markdown processor is installed by default. Its purpose is to extract code-blocks and
present them as virtual files. This means that markdown code-blocks can receive custom
rules as follows:

```js
import { defineConfig } from "@lightbase/eslint-config";

export default defineConfig(
	{},
	{
		files: ["**/*.md/*.js"],
		rules: {
			"no-unused-vars": "off",
		},
	},
);
```

### React

The config optionally supports enabling React and Next.js specific rules. Add the
following dependencies:

```shell
npm install --save-dev --exact eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y eslint-plugin-no-relative-import-paths
```

If you use Next.js, make sure to also add `@next/eslint-plugin-next` via:

```shell
npm install --save-dev --exact @next/eslint-plugin-next
```

React is only support in combination with Typescript (see above), and can be enabled as
follows:

```js
import { defineConfig } from "@lightbase/eslint-config";

export default defineConfig({
	react: {
		withNextJs: true,
	},
});
```

This enables all Next.js rules and various recommended rules for React, hooks usage and
JSX accessibility.

### Globals

The config by default includes all globals for Node.js, Browser and ES2021. You can use
other predefined presets via

```js
import { defineConfig } from "@lightbase/eslint-config";

export default defineConfig({
	// Make sure to include the full setup.
	globals: ["browser", "serviceworker"],
});
```

This enables environment-specific globals for all files. For a stricter setup, use custom
configuration as explained below

```js
import globals from "globals";
import { defineConfig } from "@lightbase/eslint-config";

export default defineConfig(
	{},
	{
		files: ["**/*.js"],
		languageOptions: {
			globals: {
				...globals.es2015,
			},
		},
	},
);
```

### Ignores

ESLint will by default ignore everything as defined in your `.gitignore`. You can add new
directories like so

```js
import { defineConfig } from "@lightbase/eslint-config";

export default defineConfig(
	{
		// Define config options, explained above.
	},
	{
		// Ignore the packages/ directory.
		ignores: ["packages/**"],
	},
);
```

### Custom configuration

`defineConfig` accepts custom ESLint configuration as the 'rest' parameter. This allows
you to configure rules for specific file patterns.

```js
import { defineConfig } from "@lightbase/eslint-config";

export default defineConfig(
	{
		// Define config options, explained above.
	},
	{
		// Ignore the packages/ directory.
		ignores: ["packages/**"],
	},
	{
		// Add rules for specific files.
		file: ["**/*.ts"],
		rules: {
			"no-console": "off",
		},
	},
);
```

## IDE

### WebStorm

Configuring Webstorm to use this config can be done as follows:

- Go to `Languages & Frameworks` -> `JavaScript` -> `Code Quality Tools` -> `ESLint`
- Select `Automatic ESLint configuration`
- Set `Run for files` to `**/*.*`
- Select `Run eslint --fix on save`
- Click on `Apply` & `OK`

> [!NOTE]
>
> WebStorm sometimes doesn't pick up on an updated ESLint configuration. A restart of the
> background services fixes this.
>
> - In versions `2023.3` and below, go to the ESLint settings in your preferences
>   according to the steps above. Select `Disable ESLint configuration`, click on `Apply`
>   and select `Automatic ESLint configuration` again.
> - In versions `20241.1` and above use `Help` -> `Find action` ->
>   `Restart ESLint Service`.

## Credits

Inspired by [Dirkdev98's](https://github.com/dirkdev98) initial design, solidified with
[@antfu/eslint-config](https://github.com/antfu/eslint-config/).

## License

[MIT](./LICENSE)
