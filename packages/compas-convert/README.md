# Compas convert

Convert Compas code-bases to TypeScript and beyond.

## Context

We want to migrate all active projects to TypeScript. Allowing us to use migrate to
TypeScript powered libraries like Zod and Drizzle ORM to replace Compas.

## Goals

- Backwards compatibility; everything runs in production. We should be able to push the
  output of this tool, feature-freeze for a week to execute manual testing and then use
  our normal processes like nothing happened.
- Completeness; we would rather spend a few extra weeks polishing the output of this tool,
  than to have to do that work later across all projects manually.
- DX; the developer experience on the converted projects should be better or the same. For
  example, including the migration to Vitest in this tool will enable us to finally have
  IDE support for tests in our projects.
- Source-to-source; we will only change things in the project structure if it makes sense
  for the new tools.
- One-time only; this tool will be developed for a one-time migration of all projects.
  Afterward, we will remove it. The project will never be published to a registry like
  NPM.

## Usage

```shell
# From the repository root
npm run build:ws
npx compas-convert ../input/directory ../output/directory

# OR From this package
npm run build
npx compas-convert ../../../input/directory ./output/directory
```

## TODO

- [ ] Fully implement the 'compas-compat' target in
      [open-api-code-gen](../open-api-code-gen).
- [ ] Pre-condition: verify project uses '@lightbase/eslint-config'
- [ ] Pre-condition: verify project uses Compas
- [ ] Initial: remove jsconfig + setup tsconfig
- [x] Initial: copy (almost) all files, renaming them to `.ts`
- [ ] Pass: function doc blocks to inline types
- [ ] Pass: @compas/test to Vitest
- [ ] Pass: inline JSDoc blocks to inline types
- [ ] Pass: common issues
  - Run TypeScript and find common errors
- [ ] Pass: build step. Fixup CI, Dockerfile, docs, etc
- [ ] Pass: Generator compatibility. Create / improve Compas Typescript targets for
      tighter integrations.
