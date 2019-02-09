const killPortProcess = require('../src/index');

const PORTS = [
	1234,
	2345
];

(async function() {
	await killPortProcess(PORTS);
})();