# Lib CI

Wrapper to run NPM scripts in CI. Supports providing a Node.js version and multiple
commands. Automatically includes Yarn/NPM module cache and Next.js build caching.

## Usage

**Basic**

```yaml
# .github/workflows/ci.yml
on:
  push:
    branches:
      - main
  pull_request:

jobs:
  ci:
    uses: lightbasenl/platforms/.github/workflows/lib-ci.yml@main
    with:
      command: |
        npm run lint
        npm run build
```

**Define a Matrix**

```yaml
# .github/workflows/ci.yml
on:
  push:
    branches:
      - main
  pull_request:

jobs:
  ci:
    uses: lightbasenl/platforms/.github/workflows/lib-ci.yml@main
    strategy:
      matrix:
        runs:
          - node-version: 18
            command: |
              npm run lint
          - node-version: 20
            command: |
              npm run build
    with:
      node-version: ${{ matrix.runs.node-version }}
      command: ${{ matrix.runs.command }}
```

**Only execute a command on main**:

```yaml
# .github/workflows/ci.yml
on:
  push:
    branches:
      - main
  pull_request:

jobs:
  update-localazy:
    uses: lightbasenl/platforms/.github/workflows/lib-ci.yml@main
    with:
      node-version: 18
      main-command: |
        npx @localazy/cli upload  # ...
```

**Preventing concurrent runs**:

```yaml
# .github/workflows/ci.yml
on:
  push:
    branches:
      - main
  pull_request:

concurrency:
  group: |
    ${{ github.workflow }} @ ${{ github.event.pull_request.head.label || github.head_ref || github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    uses: lightbasenl/platforms/.github/workflows/lib-ci.yml@main
    with:
      node-version: 20
      main-command: |
        npm run build
```

## Inputs

<!-- AUTO-DOC-INPUT:START - Do not remove or modify this section -->

| INPUT                                                                | TYPE   | REQUIRED | DEFAULT           | DESCRIPTION                                                                   |
| -------------------------------------------------------------------- | ------ | -------- | ----------------- | ----------------------------------------------------------------------------- |
| <a name="input_command"></a>[command](#input_command)                | string | false    |                   | Command to run. Supports multi-line <br>strings.                              |
| <a name="input_main-command"></a>[main-command](#input_main-command) | string | false    |                   | Command to run when on <br>the main branch. Supports multi-line <br>strings.  |
| <a name="input_node-version"></a>[node-version](#input_node-version) | string | false    | `"20"`            | Node.js version to run CI <br>against.                                        |
| <a name="input_runner"></a>[runner](#input_runner)                   | string | false    | `"ubuntu-latest"` | Specify the runner to use. <br>This shouldn't be necessary for <br>most jobs. |

<!-- AUTO-DOC-INPUT:END -->

## Outputs

<!-- AUTO-DOC-OUTPUT:START - Do not remove or modify this section -->

No outputs.

<!-- AUTO-DOC-OUTPUT:END -->

## Secrets

<!-- AUTO-DOC-SECRETS:START - Do not remove or modify this section -->

No secrets.

<!-- AUTO-DOC-SECRETS:END -->
