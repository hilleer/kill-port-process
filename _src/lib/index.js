const os = require('os');
const { win32Kill, unixKill } = require('./processKill');

const mergeOptions = require('./mergeOptions');
const { arrayifyInput, validateInput } = require('./utils');

module.exports = async (input, options = {}) => {
	try {
		validateInput(input);

		options = mergeOptions(options);

		let inputArray = arrayifyInput(input);
		inputArray = inputArray.map(i => Number(i));

		switch (os.platform()) {
			case 'win32':
				return win32Kill({ inputArray, options });
			default:
				return unixKill({ inputArray, options });
		}
	} catch (error) {
		throw new KillError(error, input, options);
	}
};

class KillError extends Error {
	constructor(error, input, options) {
		const errorMessage = error.message || 'An error occured while trying to kill process(es) on provided port(s)';
		super(errorMessage);
		this.error = error;
		this.input = input;
		this.options = options;
	}
}
