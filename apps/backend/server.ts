import closeWithGrace from "close-with-grace";
import { buildApp } from "./app.js";
import dotenv from "dotenv";

dotenv.config({ path: [".env.local", ".env"] });

const app = await buildApp();

const closeGracefully = closeWithGrace({ delay: 500 }, async (options) => {
	if (options.err) {
		app.log.error(options.err);
	}

	await app.close();
});

app.addHook("onClose", (instance, done) => {
	closeGracefully.uninstall();
	return done();
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
