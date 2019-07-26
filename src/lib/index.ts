import { platform } from 'os';

import { Killer } from './killer';

export default async function(input: any, options: Options = {}) {

	try {
		const validInput = IsInputValid(input);

		if (!validInput) {
			throw new InvalidInputError('Invalid input', input);
		}

		const mergedOptions = mergeOptions(options);
		const toNumber = (value: string | number) => Number(value);
		const ports = arrayifyInput(input).map(toNumber);

		const killer = new Killer(ports, mergedOptions, platform());
		await killer.kill();
	} catch (error) {
		throw error;
	}
}

export function IsInputValid(input: any) {
	if (!input) {
		return false;
	}
	return true;
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

class InvalidInputError extends Error {
	protected input: any;
	constructor(message: string, input: any) {
		super(message);
		this.input = input;
	}
}
