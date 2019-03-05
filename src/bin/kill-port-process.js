#!/usr/bin/env node
const parse = require('get-them-args');

const killPortProcess = require('../lib/index');

(async () => {
	const args = parse(process.argv.slice(2));
	if (!args) {
		return;
	}

	const ports = parsePortFromArgs(args);

	if (!ports) {
		return;
	}

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