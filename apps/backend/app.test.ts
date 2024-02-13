import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "./app.js";

test("app", async (t) => {
	let app = await buildApp();

	t.after(() => {
		return app.close();
	});

	await t.test("foo", async (t) => {
		const response = await app.inject({
			method: "GET",
			path: "/",
		});

		assert.equal(response.statusCode, 200);
		assert.deepEqual(response.json(), { hello: "Worlds" });
	});
});
