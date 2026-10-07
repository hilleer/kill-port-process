import { arrayifyInput, isNullOrUndefined, mergeOptions, toPorts } from './helpers';
import { Killer, Signal } from './killer';

type Ports = number | number[] | string | string[];

export interface Options {
	signal: Signal
	silent: boolean;
}

export async function killPortProcess(inputPorts: Ports, inputOptions: Partial<Options> = {}) {
	if (isNullOrUndefined(inputPorts)) {
		throw new Error('No ports found in input');
	}

	const options = mergeOptions(inputOptions);

	// validate every port up front, so an invalid port neither kills the valid ones first nor is hidden by silent
	const ports = toPorts(arrayifyInput(inputPorts));

	try {
		const killer = new Killer(ports);
		await killer.kill({
			signal: options.signal,
			silent: options.silent,
		});
	} catch (error) {
		if (options.silent) {
			return;
		}

		throw error;
	}
}
