#! /usr/bin/env node
import { parseArgs } from './args';
import { killPortProcess } from '../lib/index';

(async () => {
	try {
		const { ports, options } = parseArgs(process.argv.slice(2));
		if (ports.length === 0) {
			throw new Error('No port(s) found in provided args');
		}
		await killPortProcess(ports, options);
	} catch (error) {
		console.error(error instanceof Error ? error.message : String(error));
		process.exit(1);
	}
})();
