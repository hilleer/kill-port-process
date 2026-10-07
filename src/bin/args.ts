import { Options } from '../lib/index';

export function parseArgs(args: string[]): { ports: string[]; options: Partial<Options> } {
	const ports: string[] = [];
	const options: Partial<Options> = {};

	for (let index = 0; index < args.length; index++) {
		const arg = args[index];
		if (!/^-./.test(arg)) {
			ports.push(...splitPorts(arg));
			continue;
		}

		// options may take an inline value, e.g. --port=1234
		const separator = arg.indexOf('=');
		const flag = separator === -1 ? arg : arg.slice(0, separator);
		let name = flag === '-p' ? '--port' : flag;
		let value = separator === -1 ? undefined : arg.slice(separator + 1);

		// --no-graceful and --no-silent are the same as --graceful=false and --silent=false
		if ((name === '--no-graceful' || name === '--no-silent') && value === undefined) {
			name = name.replace('--no-', '--');
			value = 'false';
		}
		// boolean flags take an optional separated value (--silent false); anything else following them is a port
		if ((name === '--graceful' || name === '--silent') && value === undefined) {
			value = isBoolean(args[index + 1]) ? args[++index] : 'true';
		}

		if (name === '--port') {
			const port = value ?? args[++index];
			if (!port || (value === undefined && port.startsWith('-'))) {
				throw new Error(`Missing port after ${flag}`);
			}
			ports.push(...splitPorts(port));
		} else if (name === '--graceful' && isBoolean(value)) {
			options.signal = value === 'true' ? 'SIGTERM' : 'SIGKILL';
		} else if (name === '--silent' && isBoolean(value)) {
			options.silent = value === 'true';
		} else {
			throw new Error(`Unknown option: ${arg}`);
		}
	}

	return { ports, options };
}

function isBoolean(value: string | undefined): value is 'true' | 'false' {
	return value === 'true' || value === 'false';
}

// Accepts a JSON array of ports, e.g. -p '[1234,2345]', as supported by earlier versions
function splitPorts(value: string): string[] {
	if (!/^\[[\s\S]*\]$/.test(value)) {
		return [value];
	}

	try {
		const parsed: unknown = JSON.parse(value);
		if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((port) => typeof port === 'number' || typeof port === 'string')) {
			return parsed.map(String);
		}
	} catch {
		// not valid JSON, so the value is rejected as an invalid port later on
	}
	return [value];
}
