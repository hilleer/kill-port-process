import { platform } from 'os';

import { arrayifyInput, InvalidInputError, IsInputValid, mergeOptions, Options } from './helpers';
import { Killer } from './killer';

export default async function(input: any, options: Options = {}) {

	try {
		const validInput = IsInputValid(input);

		if (!validInput) {
			throw new InvalidInputError('Invalid input', input);
		}

		const mergedOptions = mergeOptions(options);
		const toNumber = (value: string | number) => Number(value);
		const ports = arrayifyInput(input).map(toNumber);

		const killer = new Killer(ports, mergedOptions, platform());
		await killer.kill();
	} catch (error) {
		throw error;
	}
}
