# ESLint config

Opinionated but configurable ESLint config. Fully includes linting and formatting.

## Install

```shell
npm install --save-dev --exact @lightbase/eslint-config
```

The following dependencies are automatically installed as part of `peerDependencies`,
however custom versions can be installed via

```shell
npm install --save-dev --exact eslint prettier
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

## Options

None yet...

## Custom configuration

`defineConfig` accepts custom ESLint configuration as the 'rest' parameter. For example:

```js
import { defineConfig } from "@lightbase/eslint-config";

export default defineConfig(
	{},
	{
		// Ignore the packages/ directory.
		ignores: ["packages/**"],
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

Note that WebStorm sometimes doesn't pick up on an updated configuration. To solve this,
select `Disable ESLint configuration`, click on `Apply` and select
`Automatic ESLint configuration` again.

## Notes

We fully run Prettier as an ESLint rule on all common file types (`md`, `json`, `yml`
etc.). This allows you to have a single configuration file for all options and prevents
conflicts between multiple tools that run on save.

## Credits

Inspired by [Dirkdev98's](https://github.com/dirkdev98) initial design, solidified with
[@antfu/eslint-config](https://github.com/antfu/eslint-config/).

## License

[MIT](./LICENSE)
