# Platforms

All public packages & GitHub workflows developed and used by
[Lightbase](https://lightbase.nl).

## Overview

- Configurable [ESLint-config](./packages/eslint-config) which includes linting and
  formatting
- A [Pull-through-cache](./packages/eslint-config) with TTL, update sampling and scheduled
  eviction support.
- An [OpenAPI based code generator](./packages/open-api-code-gen) for Axios, Fetch,
  TanStack Query and more; Supporting evolving generator targets.
- Various reusable workflows:
  - [lib-license-checker](./docs/workflows/lib-license-checker.md)
  - [lib-ci](./docs/workflows/lib-ci.md)

## Recommendations

- Use [Total Typescript's TSConfig](https://github.com/total-typescript/tsconfig) package.
  It provides a sensible default TypeScript config for most use cases.

## Contributing

This repository is set up as a monorepo. All individual packages are set up with build,
test and lint setups. The workspace root maintains the below scripts to run them across
all packages in the workspace.

Development requires Node.js 22+ & NPM 10+.

```shell
# Install dependencies
npm install

# Run the 'build' script for all packages in the workspace.
# Note that Typescript is setup with project references. So packages may not have a custom build step.
npm run build:ws

# Run the 'lint' script for all packages in the workspace
npm run lint:ws

# Run the 'test' script for all packages in the workspace
# Note that we use Vitest in workspace mode, which includes all tests of sub-packages.
npm run test

# Clean ESLint cache & dist directories in the workspace.
npm run clean:ws
```

In both the workspace root and in individual packages you can run the following commands:

```shell
# Run the package specific build script
npm run build

# Run the package specific lint script
# NOTE: this may require 'npm run lint:ws' to have ran one.
npm run lint

# Run the package specific test script
npm run test

# Clean ESLint cache & dist directories
npm run clean:ws
```

## License

[MIT](./LICENSE)
