# Doc-tool

A CLI tool for maintaining and improving Markdown-based project and process documentation
with support for TOC generation, link checking, glossary suggestions, and more.

## Installation

```shell
npm install --save-dev --exact @lightbase/doc-tool
```

## Features

- 🧭 Table of contents generation
- 🔗 Broken link detection (internal & external)
- 📚 Suggest linking glossary terms (with alias support)
- 🧠 Recommend related pages using bidirectional references
- 🧾 Frontmatter validation (with Standard Schema)
- 📊 Rank pages by how often they are linked
- ⚙️ Operate on full docs or Git-diffed sections
- 🤖 GitHub PR comments for suggested changes

## Getting started

Create a file in your project root with the following contents in `docs.config.ts`.

```ts
// docs.config.ts

import { defineDocumentationConfig } from "@lightbase/doc-tool";

// Configure the doc-tool and execute its CLI.
await defineDocumentationConfig({
	contentRoots: [
		{
			path: "./docs",
		},
		{
			// Supports multiple content roots.
			path: "./other-docs",
			baseUrl: "/other", // or "https://xyz.foo/other",
			shareGlossary: false, // see below.
			toc: false, // Disable the toc by default.
		},
	],
});
```

To run doc-tool, run one of the following commands to run the config file.

```shell
# Node.js 22.6+
node ./docs.config.ts --help

# Older Node.js versions
npx tsx ./docs.config.ts --help
```

> [!NOTE]
>
> For simplicity, we use `node ./docs.config.ts` in the below examples.

This will validate the provided configuration and should output more information on how
the doc-tool can be used.

## Configuration

The full list of supported option per `contentRoot`.

### `path: string`

The path-on-disk on where to find the Markdown files. All files are always included.

### `baseUrl?: string`

Defaults to `'/'`. Customize the url for the suggested links. This can be useful when the
docs are hosted at a subpath, or when a content root is hosted at a different domain.

### `shareGlossary?: boolean`

Defaults to `true`. If glossary terms should be suggested over the different
`contentRoots`.

### `validateFrontmatter?: StandardSchema`

Validate your custom frontmatter of a page via one of the
[Standard Schema](https://github.com/standard-schema/standard-schema?tab=readme-ov-file#what-schema-libraries-implement-the-spec)
implementers. Note that doc-tool also uses some frontmatter keys, so either include these
in your validation schema or make sure that the validator accepts unknown keys.

### `toc?: boolean`

Defaults to `true`. Determine if the table of contents is generated for all pages. This
can be overwritten per page via frontmatter

```md
---
toc: false
---
```

### `relatedPages?: false|{ name?: string, max?: number }`

Defaults to `{ name: "Related pages", max: 5 }`. Customize or disable the related pages
section. Can be customized per page as well:

```md
---
related_pages: true
related_pages_name: "See also"
related_pages_max: 3
---
```

## CLI usage

> [!NOTE]
>
> The below examples assume that you have your config in 'docs.config.ts' in the root
> directory of your project. Other locations in your project are supported, but make sure
> that the paths used to locate the Markdown files are relative to the execution
> directory.

### `node ./docs.config.ts`

Run a table of contents updates, frontmatter validation, and broken-link-detection on all
Markdown files.

Locally, this will automatically persist any updates to disk. On CI, an attempt is done to
create Pull Request comments with suggestions.

### `node ./docs.config.ts suggest [glob]`

Run the suggestions for glossary linking, see-also sections and more. By default, only
suggests in newly created documentation based on Git. When a glob is passed, full file
runs are done. Note that in most shells, the glob should be in single-quotes to prevent
shell-expansion.

Locally, this will output interactive prompts to apply suggestions. On CI this will
attempt to create Pull Request comments with the suggestions.

## Conventions

For this doc-tool to work as expected, some conventions **must** be followed.

### Create links

Created links use the [github-slugger](https://github.com/Flet/github-slugger/tree/master)
package. Tracking unique slugs per file.

### Glossary

To enable glossary suggestions, add a `glossary.md` file in your documentation root. Each
term should use a second-level heading (`## Term`) and be followed by a description.
Alternative names can be listed using the following format:

```md
## Term

Alternatives: comma-separated, multi-word support, _and some basic styles as well_.

This is the meaning of my term.
```

### Table of contents

The table of contents is wrapped in `<!--  toc-marker -->` comments. If not detected, it
is assumed that a Table of Contents is not available.

## CI

Basic execution of `node ./docs.config.ts` doesn't need anything special. Doc-tool will
detect that it runs in CI and exit with a non-zero status when issues are detected. For
suggestions, doc-tool needs a Git history to work fully. In GitHub Actions this can be
done via the `actions/checkout` action:

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 2
```

### GitHub

Doc-tool has some more support for GitHub. You can pass in the `GITHUB_TOKEN` via
`--github-token ${{ secrets.GITHUB_TOKEN }}` to the doc-tool to enable this behavior.

It needs the following permissions:

```yaml
permissions:
  contents: read
  pull-requests: write
```

This allows doc-tool to detect if we are in a pull_request
(`GITHUB_EVENT_NAME !== 'pull_request'`), and infer relevant PR information from the
GitHub Workflow event (via `GITHUB_EVENT_PATH`).

It works by shelling out to the GH CLI to add comments or even commit fixes to pull
requests.

## License

[MIT](./LICENSE)
