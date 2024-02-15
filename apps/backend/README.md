# Backend

This is a test project to test the created packages in. Next to that, this is used to try
out how external packages behave in our setup.

## Development

```shell
npm install
npm run build
npm run lint
npm run test
```

## Features

- ESLint, Typescript and test setup, see the [./package.json](./package.json) scripts.
- Graceful shutdown on exit signals via
  [close-with-grace](https://npm.im/close-with-grace) in [./server.ts](./server.ts).
- Basic multipart form handling via
  [@fastify/multipart](https://npm.im/@fastify/multipart) in
  [./plugins/base.ts](./plugins/base.ts).
