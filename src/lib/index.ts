import { arrayifyInput, isNullOrUndefined, mergeOptions } from './helpers';
import { Killer } from './killer';

type Ports = number | number[] | string | string[];

export interface Options {
	[key: string]: string;
}

export async function killPortProcess(inputPorts: Ports, options: Options = {}) {
	try {
		if (isNullOrUndefined(inputPorts)) {
			throw new Error('No ports found in input');
		}

		const mergedOptions = mergeOptions(options);

		const toNumber = (value: string | number) => Number(value);
		const ports = arrayifyInput(inputPorts).map(toNumber);

		const killer = new Killer(ports, mergedOptions);
		await killer.kill();
	} catch (error) {
		throw error;
	}
}