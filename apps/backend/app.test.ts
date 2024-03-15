import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "./app.js";

void test("app", async (t) => {
	const app = await buildApp();

	t.after(() => {
		return app.close();
	});

	await t.test("foo", async () => {
		const response = await app.inject({
			method: "GET",
			path: "/",
		});

		assert.equal(response.statusCode, 200);
		assert.deepEqual(response.json(), { hello: "Worlds" });
	});

	await t.test("validation", async () => {
		const response = await app.inject({
			method: "POST",
			path: "/test-validation",
			body: {
				hello: "world",
			},
		});

		assert.equal(response.statusCode, 200);
		assert.deepEqual(response.json(), { array: [1, 2, 3] });
	});
});
