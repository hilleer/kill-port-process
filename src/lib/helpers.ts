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
