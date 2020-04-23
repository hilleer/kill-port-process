import { Killer } from './killer';

type Input = number | number[] | string | string[];

export async function killPortProcess(input: Input, options: Options = {}) {
	try {
		if (isNullOrUndefined(input)) {
			throw new Error('No port(s) found');
		}

		const mergedOptions = mergeOptions(options);

		const toNumber = (value: string | number) => Number(value);
		const ports = arrayifyInput(input).map(toNumber);

		const killer = new Killer(ports, mergedOptions);
		await killer.kill();
	} catch (error) {
		throw error;
	}
}

export function isNullOrUndefined(input: any) {
	if (input === undefined || input === null) {
		return true;
	}
	return false;
}

export function arrayifyInput(input) {
	return Array.isArray(input) ? input : [input];
}

export interface Options {
	[key: string]: string;
}

export function mergeOptions(options: Options) {
	const defaultOptions = {};

	return { ...defaultOptions, ...options };
}
