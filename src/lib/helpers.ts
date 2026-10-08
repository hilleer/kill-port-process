import { Options } from '.';

export function isNullOrUndefined(input: unknown) {
	if (input === undefined || input === null) {
		return true;
	}
	return false;
}

export function arrayifyInput<T>(input: T | T[]): T[] {
	return Array.isArray(input) ? input : [input];
}

export function mergeOptions(options: Partial<Options>): Options {
	const defaultOptions: Options = {
		signal: 'SIGKILL',
		silent: false
	};

	return { ...defaultOptions, ...options };
}

const MAX_PORT = 65535;

export function toPorts(input: unknown[]): number[] {
	// Array.from turns the holes of a sparse array into undefined, which filter and map would otherwise skip
	const values = Array.from(input);
	const invalid = values.filter((value) => toPort(value) === undefined);
	if (invalid.length > 0) {
		const formatted = invalid.map((value) => typeof value === 'string' ? JSON.stringify(value) : String(value)).join(', ');
		throw new Error(`Invalid port(s): ${formatted}. Ports must be integers between 1 and ${MAX_PORT}`);
	}

	return values.map((value) => toPort(value) as number);
}

function toPort(value: unknown): number | undefined {
	// strings must be plain digits, so values like '', ' ', '0x50', '1e3' or '80.5' are not coerced into a port
	const port = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
	if (typeof port === 'number' && Number.isInteger(port) && port >= 1 && port <= MAX_PORT) {
		return port;
	}
	return undefined;
}
