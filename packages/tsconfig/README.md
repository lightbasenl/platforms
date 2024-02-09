# TSConfig

Shared Typescript configs for various use cases.

## Install

```shell
npm install --save-dev --exact @lightbase/tsconfig
```

## Usage

Create a `tsconfig.json` as follows:

```json
{
	"extends": "@lightbase/tsconfig/node-backend.json",
	"compilerOptions": {
		"outDir": "./dist"
	}
}
```

Some configs, like the above, require the addition of keys like `outDir`. This is
necessary, since Typescript resolves those properties relative to the `./tsconfig.json`
file.

Adding or overriding properties can be done as follows:

```json5
{
	extends: "@lightbase/tsconfig/node-backend.json",
	compilerOptions: {
		outDir: "./dist",

		// Add a new option.
		strictPropertyInitialization: true,
	},
}
```

## Configs

### Node backend

```json
{
	"extends": "@lightbase/tsconfig/node-backend.json",
	"compilerOptions": {
		"outDir": "./dist"
	}
}
```

Compile ESM-based Node.js backends with sourcemaps. Requires that `outDir` is set.

### Node package

```json
{
	"extends": "@lightbase/tsconfig/node-package.json",
	"compilerOptions": {
		"outDir": "./dist"
	}
}
```

Compile ESM-based Node.js packages with sourcemaps, declarations and monorepo support.
Requires that `outDir` is set.

## License

[Apache 2.0](./LICENSE)
