import closeWithGrace from "close-with-grace";
import { buildApp } from "./app.js";
import dotenv from "dotenv";

dotenv.config({ path: [".env.local", ".env"] });

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

const app = await buildApp({
	logger: loggerConfig,
});

const closeGracefully = closeWithGrace({ delay: 500 }, async (options) => {
	if (options.err) {
		app.log.error(options.err);
	}

	await app.close();
});

app.addHook("onClose", (_, done) => {
	closeGracefully.uninstall();
	done();
});

const port = process.env.PORT ? Number(process.env.PORT) : 3001;

app.listen(
	{
		// TODO: we probly need to configure host as well for production.
		port,
	},
	(err) => {
		if (err) {
			app.log.error(err);
			process.exit(1);
		}
	},
);
