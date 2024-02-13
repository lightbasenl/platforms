import fastify from "fastify";

export async function buildApp() {
	const app = fastify();

	app.get("/", {}, async (req, res) => {
		return res.status(200).send({
			hello: "Worlds",
		});
	});

	return app;
}
