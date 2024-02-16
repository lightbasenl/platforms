import { Multipart } from "@fastify/multipart";
import fastify, { FastifyRequest } from "fastify";
import { basePlugin } from "./plugins/base.js";

export async function buildApp() {
	const loggerConfig =
		process.env.NODE_ENV === "development" ?
			{
				transport: {
					target: "pino-pretty",
					options: {
						ignore: "pid,hostname",
					},
				},
			}
		:	true;

	const app = fastify({
		logger: loggerConfig,
	});

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
