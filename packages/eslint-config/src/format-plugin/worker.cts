/* eslint-disable */
const { runAsWorker } = require("synckit");
const { format } = require("prettier");

runAsWorker(async (code: string, options: any) => {
	try {
		return format(code, options);
	} catch {
		return code;
	}
});
