import { Multipart } from "@fastify/multipart";
import fastify, { FastifyBaseLogger, FastifyHttpOptions, FastifyRequest } from "fastify";
import * as http from "node:http";
import { basePlugin } from "./plugins/base.js";

export async function buildApp(opts: FastifyHttpOptions<http.Server> = {}) {
	const app = fastify<
		http.Server,
		http.IncomingMessage,
		http.ServerResponse,
		FastifyBaseLogger
	>(opts);

	app.register(basePlugin);

	app.route({
		method: "post",
		url: "/base/multipart",

		// TODO: request validation with 'sharedSchemaId' from fastify/multipart

		handler: async function (
			request: FastifyRequest<{
				Body: Record<string, Multipart>;
			}>,
			reply,
		) {
			// console.log(request.body);

			return reply.send(
				Object.keys(request.body).map((key) => ({
					key,
					value:
						request.body[key]?.type === "file" ?
							request.body[key]?.mimetype
						:	// @ts-expect-error
							request.body[key]?.value,
				})),
			);
		},
	});

	app.get("/", {}, async (req, reply) => {
		return reply.status(200).send({
			hello: "Worlds",
		});
	});

	return app;
}
