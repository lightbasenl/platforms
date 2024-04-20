/* eslint-disable */
const { runAsWorker } = require("synckit");
const { format } = require("prettier");

runAsWorker(async (code: string, options: any) => {
	return format(code, options);
});
