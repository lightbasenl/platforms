# Using Vitest

## Context

We currently test our packages with the use of the Node.js [built-in test runner][1]. This
has a few downsides:

- We write the test files with TypeScript, so either need to use a 'loader' like `tsx` or
  transpile tests before running them.
- The Node.js test runner just doesn't have the IDE support that we expect.

## Decision

Use [Vitest][2]. Webstorm comes with decent support. It supports on the fly transpiling of
TypeScript and many more things. While staying fast, and only requiring a few lines of
config.

Another useful feature of Vitest is the out-of-the-box support for workspaces, which means
that launching tests from the root or per package works seamlessly.

## Consequences

In the future we may have the need to support JSX in certain packages and thus tests,
which Vitest supports. For other scenarios, Vite(st) plugins are most likely available.

---

[1]: https://nodejs.org/api/test.html
[2]: https://vitest.dev/
