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

export class InvalidInputError extends Error {
	protected input: any;
	constructor(message: string, input: any) {
		super(message);
		this.input = input;
	}
}
