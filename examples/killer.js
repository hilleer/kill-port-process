/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
const killPortProcess = require('../dist/lib/index').default;

const PORTS = [
	1234,
	2345
];

(async function() {
	await killPortProcess(PORTS);
})();