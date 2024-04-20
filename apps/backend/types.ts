import type http from "node:http";
import type { FastifyInstance } from "fastify";

export type FastifyBase = FastifyInstance<
	http.Server,
	http.IncomingMessage,
	http.ServerResponse
>;
