# Platforms

All public packages & GitHub workflows developed and used by
[Lightbase](https://lightbase.nl).

## Overview

- Various [TSConfigs](./packages/tsconfig) to extend from
- Configurable [ESLint-config](./packages/eslint-config) which includes linting and
  formatting

## Contributing

This repository is set up as a monorepo. All individual packages are set up with build,
test and lint setups. The workspace root maintains the below scripts to run them across
all packages in the workspace.

```shell
# Install dependencies
npm install

# Run the 'build' script for all packages in the workspace
npm run build:ws

# Run the 'lint' script for all packages in the workspace
npm run lint:ws

# Run the 'test' script for all packages in the workspace
npm run test:ws
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
```

## License

[Apache 2.0](./LICENSE)
