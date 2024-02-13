import { FastifyInstance, FastifyRegisterOptions, RegisterOptions } from "fastify";
import fp from "fastify-plugin";
import fastifyMultipart, { FastifyMultipartBaseOptions } from "@fastify/multipart";

async function base(
	fastify: FastifyInstance,
	options: RegisterOptions & {
		multipart?: FastifyMultipartBaseOptions;
	},
) {
	// TODO: should only be enabled for specific plugin contexts. So we may want to expose a function with these defaults at some point?

	fastify.register(fastifyMultipart, {
		limits: {
			// Max field name size in bytes
			fieldNameSize: 100,

			// Max field value size in bytes
			fieldSize: 512,

			// Max number of non-file fields
			fields: 10,

			// For multipart forms, the max file size in bytes
			fileSize: 15 * 1024 * 1024,

			// Max number of file fields
			files: 5,

			// Max number of header key=>value pairs
			headerPairs: 500,

			// For multipart forms, the max number of parts (fields + files)
			parts: 100,
			...options.multipart?.limits,
		},
		attachFieldsToBody: true,

		// TODO: with these limits, we probably want to specify an 'onFile' and save temporary to
		//  disk.

		...options.multipart,
	});
}

export const basePlugin = fp(base, {
	name: "base",
	encapsulate: false,
});
