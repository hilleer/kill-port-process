#!/usr/bin/env node
const parse = require('get-them-args');

const killPortProcess = require('../lib/index');

(async () => {
	const args = parse(process.argv.slice(2));
	console.log('args', args);
	if (!args) {
		return;
	}

	const ports = parsePortFromArgs(args);

	console.log('Attempting to kill port(s):', ports);
	await killPortProcess(ports);
})();

function parsePortFromArgs(args) {
	if (args.p) {
		return args.p;
	}
	if (args.port) {
		return args.port;
	}
	return args.unknown;
}