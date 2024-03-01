import fastifyMultipart, { FastifyMultipartBaseOptions } from "@fastify/multipart";
import { RegisterOptions } from "fastify";
import fastifyCustomHealthCheck from "fastify-custom-healthcheck";
import fastifyHelmet from "@fastify/helmet";

import fp from "fastify-plugin";
import {
	serializerCompiler,
	validatorCompiler,
	ZodTypeProvider,
} from "fastify-type-provider-zod";
import { FastifyBase } from "../types.js";

async function base(
	fastify: FastifyBase,
	options: RegisterOptions & {
		multipart?: FastifyMultipartBaseOptions;
	},
) {
	const app = fastify
		.withTypeProvider<ZodTypeProvider>()
		.setValidatorCompiler(validatorCompiler)
		.setSerializerCompiler(serializerCompiler);

	// TODO: should only be enabled for specific plugin contexts. So we may want to expose a
	// function with these defaults at some point?

	app.register(fastifyMultipart, {
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

	app.register(fastifyHelmet, {
		global: true,
		contentSecurityPolicy: {
			// See https://infosec.mozilla.org/guidelines/web_security#content-security-policy:~:text=recommended%20for%20APIs%20to%20use
			useDefaults: false,
			directives: {
				"default-src": "'none'",
				"frame-ancestors": "'none'",
			},
		},

		// IE8 only, which we don't support
		xDownloadOptions: false,
	});

	// TODO: Why do we need `as any` here?
	app.register(fastifyCustomHealthCheck as any, {
		// TODO: we should allow configuring one or multiple routes

		path: "/health",
		info: {},
		schema: false,
	});

	app.ready(() => {
		app.addHealthCheck("label", () => true, {
			value: true,
		});
	});
}

export const basePlugin = fp(base, {
	name: "base",
	encapsulate: false,
});
