# ESLint config

Opinionated but configurable ESLint config. Fully includes linting and formatting.

## Install

```shell
npm install --save-dev --exact @lightbase/eslint-config
```

The following dependencies are automatically installed as part of `peerDependencies`,
however custom versions can be installed via

```shell
npm install --save-dev --exact eslint typescript-eslint
```

Some configurations require manually installed plugins.

[//]: # "TODO: update example if we have a good one"

```shell
npm install --save-dev --exact eslint-plugin-jsdoc
```

## Usage

This package builds a config, compatible with
[ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files-new).
To use the config, create the following `eslint.config.js` file:

```js
import { defineConfig } from "@lightbase/eslint-config";

export default defineConfig({});
```

Add the following scripts to your `package.json`:

```json
{
	"scripts": {
		"lint": "eslint . --fix --cache --cache-strategy content --cache-location .cache/eslint/ --color",
		"lint:ci": "eslint ."
	}
}
```

> Make sure to add `.cache` to your .gitignore

### In a CommonJS project

Note, these steps will be obsolete with ESLint v9, which at the time of writing is in
alpha.

- Use `eslint.config.mjs` instead of `eslint.config.js`
- Specify `--config eslint.config.mjs` in the `package.json` scripts.

## Default configuration and options

### Custom configuration

`defineConfig` accepts custom ESLint configuration as the 'rest' parameter. For example:

```js
import { defineConfig } from "@lightbase/eslint-config";

export default defineConfig(
	{
		// Define config options, explained below.
	},
	{
		// Ignore the packages/ directory.
		ignores: ["packages/**"],
	},
);
```

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

[Typescript ESLint](http://typescript-eslint.io/) is automatically enabled if either
`tsconfig.eslint.json` or `tsconfig.json` is present, preferring to use the former.

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

Providing a custom tsconfig location is possible as well:

```js
import { defineConfig } from "@lightbase/eslint-config";

export default defineConfig({
	typescript: {
		project: "./tsconfig.test.json",
	},
});
```

Or explicitly disabling Typescript support

```js
import { defineConfig } from "@lightbase/eslint-config";

export default defineConfig({
	typescript: false,
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
> WebStorm sometimes doesn't pick up on an updated ESLint configuration. A restart
> of the background services fixes this.
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
