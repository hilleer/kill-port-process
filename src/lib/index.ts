import { arrayifyInput, isNullOrUndefined, mergeOptions } from './helpers';
import { Killer } from './killer';

type Input = number | number[] | string | string[];

export interface Options {
	[key: string]: string;
}

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