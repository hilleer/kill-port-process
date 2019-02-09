const os = require('os');
const { win32Kill, unixKill } = require('./processKill');

const mergeOpts = require('./mergeOpts');
const { arrayifyInput, validateInput } = require('./utils');

module.exports = async (input, opts = {}) => {
	try {
		validateInput(input);

		opts = mergeOpts(opts);

		const inputArray = arrayifyInput(input);

		switch (os.platform()) {
			case 'win32':
				return win32Kill({ inputArray, opts });
			default:
				return unixKill({ inputArray, opts });
		}
	} catch (error) {
		throw error;
	}
};