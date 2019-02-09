module.exports = {
	arrayifyInput,
	validateInput
};

function arrayifyInput(input) {
	return Array.isArray(input) ? input : [input];
}

function validateInput(input) {
	if (input === undefined || input === null) {
		throw new Error('Received undefined or null input');
	}
}