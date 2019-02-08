const killPortProcess = require('../src/index');

main();

async function main() {
	await killPortProcess(1234);
}