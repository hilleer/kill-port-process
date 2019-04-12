import { platform } from 'os';

import { Killer } from './killer';

export default function(input, options: Options = {}) {
	
	try {
		validateInput(input);
		const mergedOptions = mergeOptions(options);
		const ports = arrayifyInput(input).map(i => Number(i));

		const killer = new Killer(ports, mergedOptions);

		switch(platform()) {
			case 'win32':
				return killer.win32Kill();
			default:
				return killer.unixKill();
		}
		
	} catch (error) {
		
	}
}

function validateInput(input) {
	if (!input) {
		throw new InvalidInputError('No input provided');
	}
}

function arrayifyInput(input) {
	return Array.isArray(input) ? input : [input];
}

export type Options = {};

function mergeOptions(options: Options) {
	const defaultOptions = {};

	return { ...defaultOptions, options};
}

class InvalidInputError extends Error {
	constructor(message) {
		super(message);
	}
}
