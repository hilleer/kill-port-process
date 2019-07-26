#! /usr/bin/env node
import * as getThemArgs from 'get-them-args';

import killPortProcess from '../lib/index';

(async () => {
	const args = getThemArgs(process.argv.slice(2));

	if (!args) {
		console.error('No args provided');
		process.exit(1);
	}

	const ports = parsePortFromArgs(args);

	if (!ports) {
		console.error('No port(s) found in provided args');
		process.exit(1);
	}

	await killPortProcess(ports);
})();

type Ports = string | number | string[] | number[];
interface Args {
	p?: Ports;
	port?: Ports;
	unknown?: Ports;
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
