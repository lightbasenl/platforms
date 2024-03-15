import assert from "node:assert/strict";
import * as fs from "node:fs";
import { test } from "node:test";

import { buildApp } from "../app.js";

void test("base", async (t) => {
	const app = await buildApp();
	const server = await app.listen({
		port: 0,
	});

	t.after(() => {
		return app.close();
	});

	await t.test("multipart", async () => {
		const form = new FormData();
		form.append("foo", "bar");
		form.append("file1", await fs.openAsBlob("package.json"), "package.json");

		const response = await fetch(server + "/base/multipart", {
			method: "post",
			body: form,
		});

		const data = await response.json();

		assert.equal(response.status, 200);
		assert.deepEqual(data, [
			{
				key: "foo",
				value: "bar",
			},
			{
				key: "file1",
				value: "application/octet-stream",
			},
		]);
	});

	await t.test("health check", async (t) => {
		await t.test("success", async () => {
			const response = await app.inject({
				method: "get",
				path: "/health",
			});

			assert.equal(response.statusCode, 200);
			assert.equal(response.json().healthChecks.label, "HEALTHY");
		});

		await t.test("fail", async () => {
			app.addHealthCheck("label2", () => false, { value: true });
			const response = await app.inject({
				method: "get",
				path: "/health",
			});

			assert.equal(response.statusCode, 500);
			assert.equal(response.json().healthChecks.label2, "FAIL");
		});
	});
});
