import { arrayifyInput, isNullOrUndefined, mergeOptions } from './helpers';
import { Killer, Signal } from './killer';

type Ports = number | number[] | string | string[];

export interface Options {
	signal: Signal
}

export async function killPortProcess(inputPorts: Ports, inputOptions: Partial<Options> = {}) {
	if (isNullOrUndefined(inputPorts)) {
		throw new Error('No ports found in input');
	}

	const options = mergeOptions(inputOptions);

	const toNumber = (value: string | number) => Number(value);
	const ports = arrayifyInput(inputPorts).map(toNumber);

	const killer = new Killer(ports);
	await killer.kill({
		signal: options.signal
	})
}