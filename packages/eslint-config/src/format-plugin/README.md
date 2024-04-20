# Forked format plugin with some of its dependencies

Forked from:

- https://github.com/antfu/eslint-plugin-format/tree/acfb3d2d3b8a06e72a5412deb8cd0fee88f05370
- https://github.com/antfu/eslint-formatting-reporter/tree/e23ad192dd7b958757b444d6509137cf2cc55d45
- https://github.com/prettier/prettier-linter-helpers/tree/71259f6e63d42317d65edcd2a93de0c372703b6d
- https://github.com/so1ve/eslint-parser-plain/tree/8339ee4a8226b05bd5f0944b6df1f58d98abe6cb

See the above sources for the original licenses.

Changes;

- Uses diff-match-patch instead of fast-diff. This has a configurable deadline, making
  sure that creating the patch doesn't take more than 2 seconds.
- Combined all files in a few to quickly port the changes.

We will run with this setup for a bit before attempting to upstream to
prettier-linter-helpers.
