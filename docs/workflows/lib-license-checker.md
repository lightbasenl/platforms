# Lib license checker

Check if all production dependencies of the project complies with the allowed licenses.

## Usage

```yaml
# .github/workflows/license-check.yml
on:
  push:
    paths:
      - "**/package.json"
      - "yarn.lock"
      - "package-lock.json"

jobs:
  license-check:
    uses: lightbasenl/platforms/.github/workflows/lib-license-checker.yml@main
    with:
      # Inputs
```

## Inputs

<!-- AUTO-DOC-INPUT:START - Do not remove or modify this section -->

| INPUT                                                                            | TYPE   | REQUIRED | DEFAULT | DESCRIPTION                                           |
| -------------------------------------------------------------------------------- | ------ | -------- | ------- | ----------------------------------------------------- |
| <a name="input_exclude-packages"></a>[exclude-packages](#input_exclude-packages) | string | false    |         | Semicolon separated list of dependencies <br>to skip. |

<!-- AUTO-DOC-INPUT:END -->

## Outputs

<!-- AUTO-DOC-OUTPUT:START - Do not remove or modify this section -->

No outputs.

<!-- AUTO-DOC-OUTPUT:END -->

## Secrets

<!-- AUTO-DOC-SECRETS:START - Do not remove or modify this section -->

No secrets.

<!-- AUTO-DOC-SECRETS:END -->
