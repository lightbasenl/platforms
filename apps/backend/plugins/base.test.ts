import assert from "node:assert/strict";
import * as fs from "node:fs";
import { test } from "node:test";

import { buildApp } from "../app.js";

test("base", async (t) => {
	let app = await buildApp();
	const server = await app.listen({
		port: 0,
	});

	t.after(() => {
		return app.close();
	});

	await t.test("multipart", async (t) => {
		const form = new FormData();
		form.append("foo", "bar");
		form.append("file1", await fs.openAsBlob("package.json"), "package.json");

		const response = await fetch(server + "/base/multipart", {
			method: "post",
			body: form,
		});

		const data = await response.json();
		console.log(data);

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
});
