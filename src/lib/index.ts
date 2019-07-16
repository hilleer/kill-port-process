import { platform } from 'os';

import { Killer } from './killer';

export default async function(input, options: Options = {}) {

	try {
		validateInput(input);
		const mergedOptions = mergeOptions(options);
		const ports = arrayifyInput(input).map(i => Number(i));

		const killer = new Killer(ports, mergedOptions, platform());
		await killer.kill();
	} catch (error) {
		throw error;
	}
}

export function validateInput(input) {
	if (!input) {
		console.log('throwing');
		throw new InvalidInputError('No input provided');
	}
	console.log('not throwing');
}

export function arrayifyInput(input) {
	return Array.isArray(input) ? input : [input];
}

export type Options = {};

export function mergeOptions(options: Options) {
	const defaultOptions = {};

	return { ...defaultOptions, options };
}

export class InvalidInputError extends Error {
	constructor(message) {
		super(message);
	}
}
