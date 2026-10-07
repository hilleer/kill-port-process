import { Options } from '../lib/index';

export function parseArgs(args: string[]): { ports: string[]; options: Partial<Options> } {
	const ports: string[] = [];
	const options: Partial<Options> = {};

	for (let index = 0; index < args.length; index++) {
		const arg = args[index];
		if (arg === '-p' || arg === '--port') {
			const port = args[++index];
			if (!port || port.startsWith('-')) {
				throw new Error(`Missing port after ${arg}`);
			}
			ports.push(port);
		} else if (arg.startsWith('-p=') || arg.startsWith('--port=')) {
			const port = arg.slice(arg.indexOf('=') + 1);
			if (!port) {
				throw new Error(`Missing port after ${arg.slice(0, arg.indexOf('='))}`);
			}
			ports.push(port);
		} else if (arg === '--graceful' || arg === '--graceful=true') {
			options.signal = 'SIGTERM';
		} else if (arg === '--graceful=false') {
			options.signal = 'SIGKILL';
		} else if (arg === '--silent' || arg === '--silent=true') {
			options.silent = true;
		} else if (arg === '--silent=false') {
			options.silent = false;
		} else if (arg.startsWith('-')) {
			throw new Error(`Unknown option: ${arg}`);
		} else {
			ports.push(arg);
		}
	}

	return { ports, options };
}
