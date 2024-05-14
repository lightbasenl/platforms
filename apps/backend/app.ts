import type * as http from "node:http";
import type { Multipart } from "@fastify/multipart";
import type { FastifyHttpOptions, FastifyRequest } from "fastify";
import fastify from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { basePlugin } from "./plugins/base.js";

export async function buildApp(opts: FastifyHttpOptions<http.Server> = {}) {
	const app = fastify<http.Server, http.IncomingMessage, http.ServerResponse>(
		opts,
	).withTypeProvider<ZodTypeProvider>();

	await app.register(basePlugin);

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

					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					value:
						request.body[key]?.type === "file" ?
							request.body[key]?.mimetype
						:	request.body[key]?.value,
				})),
			);
		},
	});

	app.get("/", {}, async (req, reply) => {
		return reply.status(200).send({
			hello: "Worlds",
		});
	});

	app.post(
		"/test-validation",
		{
			schema: {
				body: z.object({
					hello: z.string(),
				}),
				response: {
					200: z.object({
						array: z.array(z.number()),
					}),
				},
			},
		},
		async (req, reply) => {
			req.log.info(req.body);

			return reply.status(200).send({
				array: [1, 2, 3],
			});
		},
	);

	return app;
}
