#! /usr/bin/env node
const parse = require('get-them-args');

import { killPortProcess } from '../lib/index';

(async () => {
	const args = parse(process.argv.slice(2));

	if (!args) {
		console.error('No args provided');
		process.exit(1);
	}

	console.log('args:::', args);

	console.log('parse ports....');
	const ports = parsePortFromArgs(args);

	console.log('ports::::', ports);

	if (!ports) {
		console.error('No port(s) found in provided args');
		return process.exit(1);
	}

	const flags = getFlagsFromArgs(args);

	console.log('flags:.', flags);

	await killPortProcess(ports);
})();

type Ports = string | number | string[] | number[];
interface Args {
	p?: Ports;
	port?: Ports;
	unknown?: Ports;
	graceful?: boolean;
}

function parsePortFromArgs(args: Args) {
	if (args.p) {
		return args.p;
	}

	if (args.port) {
		return args.port;
	}

	return args.unknown;
}

type Flags = {
	graceful?: boolean;
}

function getFlagsFromArgs(args: Args): Flags {
	const flags: Flags = {};

	if (args.graceful) {
		flags.graceful = true;
	}

	return flags;
}
