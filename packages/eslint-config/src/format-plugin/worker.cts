/* eslint-disable */
const { runAsWorker } = require("synckit");
const { format } = require("prettier");

runAsWorker(async (code: string, options: any) => {
	try {
		return format(code, options);
	} catch (e) {
		// By default ignore errors. These are most likely parse errors, already reported by other
		// plugins.
		if (process.env.DEBUG) {
			console.error(e);
		}
		return code;
	}
});
