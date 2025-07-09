#! /usr/bin/env node
const parse = require('get-them-args');

import { killPortProcess, Options } from '../lib/index';

(async () => {
	const args = parse(process.argv.slice(2));

	if (!args) {
		console.error('No args provided');
		process.exit(1);
	}

	const ports = parsePortFromArgs(args);

	if (!ports) {
		console.error('No port(s) found in provided args');
		return process.exit(1);
	}

	const flags = parseFlagsFromArgs(args);
	const options = formatOptions(flags);

	await killPortProcess(ports, options);
})();

type Ports = string | number | string[] | number[];
interface Args {
	p?: Ports;
	port?: Ports;
	unknown?: Ports;
	graceful?: boolean;
	silent?: boolean;
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
	silent?: boolean;
}

function parseFlagsFromArgs(args: Args): Flags {
	const flags: Flags = {};

	if (args.graceful) {
		flags.graceful = true;
	}

	if (args.silent) {
		flags.silent = true;
	}

	return flags;
}

function formatOptions(flags: Flags): Partial<Options> {
	const { graceful, silent } = flags;

	const options: Partial<Options> = {};

	if (graceful) {
		options.signal = 'SIGTERM';
	}

	if (silent) {
		options.silent = silent;
	}

	return options;
}
