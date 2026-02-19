# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## Overview

NPM workspaces monorepo (`packages/*`) by [Lightbase](https://lightbase.nl) containing
shared ESLint config, a pull-through cache, utility functions, and a documentation CLI
tool. All packages are published under the `@lightbase` scope.

## Commands

```bash
# Install dependencies
npm install

# Build all packages (TypeScript project references)
npm run build:ws

# Run all tests (Vitest workspace mode)
npm run test

# Run tests for a single package
npm run test -- packages/utils

# Run a specific test file
npm run test -- packages/utils/test/is.test.ts

# Lint and auto-fix all packages
npm run lint:ws

# Lint without auto-fix (CI mode)
npm run lint:ci:ws

# Clean caches and dist directories
npm run clean:ws
```

Individual package commands (`build`, `lint`, `test`, `clean`) also work via
`npm run <script>` from within the package directory.

## Architecture

### Packages

- **`@lightbase/eslint-config`** — Flat config ESLint setup integrating Prettier,
  TypeScript ESLint, import ordering, Markdown linting, and optional React/Next.js
  support. Used by all other packages. Entry point: `defineConfig()`.
- **`@lightbase/pull-through-cache`** — In-memory cache with TTL, update sampling
  (step/random), and scheduled eviction. Zero dependencies.
- **`@lightbase/utils`** — Type guards (`isNil`, `isRecord`, `isRecordWith`), assertion
  functions (`assert`, `assertNotNil`), `createInvariant`, and TypeScript type utilities
  (`Brand`, `Prettify`, `MaybePromise`, etc.). Has a `./node` subpath export for
  `createAsyncLocalStorage`.
- **`@lightbase/doc-tool`** — CLI for Markdown documentation: TOC generation, broken link
  detection, frontmatter validation, glossary suggestions. Depends on `@lightbase/utils`.

### Key conventions

- **ESM only** — All packages use `"type": "module"`. Imports require explicit `.js`
  extensions.
- **TypeScript project references** — Root `tsconfig.json` references all packages. Each
  package compiles to `dist/src/`. Base config is `@total-typescript/tsconfig`.
- **`erasableSyntaxOnly: true`** — TypeScript is configured to only allow type syntax that
  can be erased (no enums, no parameter properties).
- **Vitest** — Tests live in `packages/*/test/` directories as `.test.ts` files.
  Type-level tests use `expectTypeOf` from Vitest. Parametrized tests use `it.for()`.
- **No package-lock** — `.npmrc` has `package-lock=false`.
- **Conventional commits** — Used for changelogs and release-please automation. Scoped
  types like `feat(utils):`, `fix(eslint-config):`.
- **`patch-package`** — Runs on `postinstall` for any patches in the `patches/` directory.

### Dependency graph

```
doc-tool → utils
eslint-config (standalone, used as devDep by all packages)
pull-through-cache (standalone, zero deps)
utils (standalone, zero deps)
```

### Release

Managed by release-please. Packages with automated releases: `eslint-config`,
`pull-through-cache`, `utils`. The `doc-tool` package is not yet released.

### Architecture decisions

Documented in `docs/decisions/`. New decisions should follow the template in
`000-template.md`.
