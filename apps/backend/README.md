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

- ESLint, Typescript and test setup with [node:test](https://nodejs.org/api/test.html) and
  [node:assert/strict](https://nodejs.org/api/assert.html#strict-assertion-mode).
- `.env` & `.env.local` support via [dotenv](https://npm.im/dotenv).
- Pretty logs in development with [pino-pretty](https://npm.im/pino-pretty).
- Graceful shutdown on exit signals via
  [close-with-grace](https://npm.im/close-with-grace).
- Basic multipart form handling via
  [@fastify/multipart](https://npm.im/@fastify/multipart).
