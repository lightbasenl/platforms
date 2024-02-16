import type { FastifyBaseLogger, FastifyInstance } from "fastify";
import http from "node:http";

export type FastifyBase = FastifyInstance<
	http.Server,
	http.IncomingMessage,
	http.ServerResponse,
	FastifyBaseLogger
>;
