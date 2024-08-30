# OpenAPI code generation

Generate evolving API clients based on an OpenAPI specification.

## Install

```shell
npm install --save-dev --exact @lightbase/open-api-code-gen
```

## Usage

Create a file with the following contents in `generate.config.ts`. You can move this file
later to any location.

```ts
// generate.config.ts
import { defineOpenApiCodeGen } from "@lightbase/open-api-code-gen";

defineOpenApiCodeGen({
	sources: [
		{
			url: "https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0/petstore.json",
		},
	],
});
```

With Node.js 22+:

```shell
node --experimental-strip-types ./generate.config.ts --help
```

or with older Node.js versions

```shell
npx tsx ./generate.config.ts --help
```

This should validate the provided sources and give you an idea of what is possible.

### CLI usage

> [!NOTE]
>
> The below examples assume that you have your config in 'generate.config.ts' in the root
> directory of your project. Other locations in your project are supported, but the tool
> should always be started from your project root.

> [!NOTE]
>
> For simplicity, we use `node ./generate.config.ts`. Make sure to use
> `--experimental-strip-types` or `tsx` as described above.

#### `node ./generate.config.js`

Generates the HTTP client, client wrapper and other supported outputs based on the defined
sources and targets.

#### `node ./generate.config.js --resolve-types`

Resolve the OpenAPI specification and update the types for better auto-completion in
`defineOpenApiCodeGen`. This writes a file to the `.cache` directory.

### Programmatic usage

#### `defineOpenApiCodeGen`

The main entrypoint for defining your sources and targets. See
[OpenApiCodeGenOptions](#OpenApiCodeGenOptions) below.

## API

### OpenApiCodeGenOptions

Configuration object to customize code generation.

#### `sources: Array<LoaderSource>`

Specify one or more files, directories, or urls to load the OpenAPI specifications from.
Supports loading Swagger 2.0, OpenAPI 3.0 and OpenAPI 3.1 files.

When the loaded files have references to other files, the loader will try to resolve those
files as well.

```ts
import { defineOpenApiCodeGen } from "@lightbase/open-api-code-gen";

defineOpenApiCodeGen({
	sources: [
		{
			file: "./specs/example.json", // or file.yaml
		},
		{
			directory: "./specs", // Tries to load openapi.json, openapi.yaml or swagger.json.
		},
		{
			url: "https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0/petstore.json",

			// You can provide a custom Fetch function to support things like Authorization headers or a
			// proxy.
			fetch: (input, init) => {
				if (input instanceof Request) {
					input.headers.set("Authozation", "Bearer ...");
				} else if (typeof init?.headers === "object") {
					if (init.headers instanceof Headers) {
						init.headers.set("Authozation", "Bearer ...");
					} else if (Array.isArray(init.headers)) {
						init.headers.push(["Authorization", "Bearer ..."]);
					} else {
						init.headers["Authorization"] = "Bearer ...";
					}
				}

				return fetch(input, init);
			},
		},
	],
});
```

#### `targets: Array<GeneratorTarget>`

Specify one or more generation targets. A generation target determines the HTTP client
that is used, if a wrapper is generated to work with tools like TanStack Query and how the
output directory is formatted. Each target has their own supported configuration.

With the `locked` option supported by all targets, you can limit that target to the
already generated routes. This allows you to still add new properties to an existing
route, like altering the response schema. However, it prevents new routes from being
generated. The next target will generate those routes.

```ts
import { defineOpenApiCodeGen } from "@lightbase/open-api-code-gen";

defineOpenApiCodeGen({
	sources: [
		{
			file: "./specs/example.json", // or file.yaml
		},
	],
	targets: [
		{
			type: "axios-node",
			locked: true,
		},
		{
			type: "undici",
		},
	],
});
```

#### `hooks: GlobalHooks`

Customize the specifications and/or output.

- TODO:

## Targets

### Shared target options

- `outputDirectory: string`: the output directory to write files to.
- `locked?: boolean`: Lock this target to the already generated routes. See
  ['Evolving the output'](#evolving-the-output) for more information.
- `groupBy: object|function`:
  - `{ by: "tag", defaultGroup: string }`: Group resources by tag. If multiple tags are
    available, only the first one is used. If no tag is available, `defaultGroup` is used.
  - `{ by: "path", defaultGroup: string }`: Group resource by the first 'path'-part. For
    example `/users/list` will group this route under `users`.
  - `(resource: object) => string`: Custom group by function. This allows you to combine
    all routes in a single group or apply custom grouping.
  - Default: `{ by: "tag", defaultTag: "uncategorized" }`

### compas-compat-web

_Only for backwards compatibility. It is advised to lock this target, to start migrating
away to more modern output formats._

The generated output is mostly compatible with the Compas generators. This target
generates a single TypeScript file with all the types, an Axios-based HTTP client and a
React-Query wrapper using `useQuery` and `useMutation` hooks. It follows the output
structure of Compas.

### compas-compat-rn

_Only for backwards compatibility. It is advised to lock this target, to start migrating
away to more modern output formats._

Like [compas-compat-web](#compas-compat-web), but using the React-Native variants of Web
APIs like FormData.

### TODO

Some targets are still WIP:

- Node.js Axios client
- Node.js Undici client
- RQ queryOptions API
- Zod schema's
- Mocks with Faker
- And more like;
  - Customizing the output directory
  - Customizations per resource, etc.

## OpenAPI extensions

This generator supports a few OpenAPI extensions.

### x-invalidations

A specification aired by Compas to have backend guided route invalidations for React
Query.

### x-idempotent

Backend guided idempotency for routes that are normally mutations. In the future, we may
drop this in favor of the `QUERY` HTTP method, once that has reached wide support. Note
that this extension isn't supported in all generator targets. In most cases, you can then
use a path override to get the mutation or query variants.

## Evolving the output

This code-generator is explicitly designed to evolving needs of long maintained projects.
The main element of this is the `locked` property on generator targets. This writes a
`code-gen-locked.json` file to the output directory, which is used in later generator
calls. The file contains the resources included in this generator target, preventing
additional resources to be generated by the target.

When migrating a resource to the next target, manual removal of that resource from
`code-gen-locked.json` is necessary. Once executed again, the next available target should
have picked up the available resource.

## License

[MIT](./LICENSE)
