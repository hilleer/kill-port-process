import { Options } from '.';

export function isNullOrUndefined(input: any) {
	if (input === undefined || input === null) {
		return true;
	}
	return false;
}

export function arrayifyInput(input: any) {
	return Array.isArray(input) ? input : [input];
}

export function mergeOptions(options: Partial<Options>): Options {
	const defaultOptions: Options = {
		signal: 'SIGKILL',
		silent: false
	};

	return { ...defaultOptions, ...options };
}
