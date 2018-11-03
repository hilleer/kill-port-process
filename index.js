const { exec } = require('child_process');
const os = require('os');
const pidFromPort = require('pid-from-port');

module.exports = async (input, opts = {}) => {
	try {
		validateInput(input);

		const defaultOpts = {

		};
		opts = Object.assign(defaultOpts, opts);
		const inputArray = arrayifyInput(input);

		if (os.platform() === 'win32') {
			await win32Kill(inputArray, opts)
		} else {
			await defaultKill(inputArray, opts);
		}
	} catch (error) {
		throw error;
	}
	return;
};


function validateInput(input) {
	if (input === undefined || input === null) {
		console.log('throwing');
		throw new Error('Received undefined or null input');
	}
}

function arrayifyInput(input) {
	return Array.isArray(input) ? input : [input];
}

async function defaultKill(input, opts) {
	const promises = input.map(killPortProcess);
	Promise.all(promises).catch();

	async function killPortProcess(input) {
		return new Promise((resolve, reject) => {
			const command = `lsof -i tcp:${input} | grep LISTEN | awk '{print $2}' | xargs kill -9`;
			exec(command, (err, stdout, stderr) => {
				if (err) {
					reject(err);
				}
				log(`Successfully terminated process running on port ${input}`);
				resolve();
			});
		});
	}
}

async function win32Kill(input, opts) {
	const inputs = input.map(parseInput);
	const promises = inputs.map(killPortProcess);
	await Promise.all(promises).catch();

	async function killPortProcess(input) {
		const { port, pid } = await input;
		return new Promise((resolve, reject) => {
			exec(`taskkill /PID ${pid} /F`, (err, stdout, stderr) => {
				if (err) {
					reject(`Failed to terminate proccess on port ${port} with pid ${pid}`);
				}
				console.log(`Successfully terminated process running on port ${port} with pid ${pid}`);
				resolve(stdout);
			})
		});
	}
}

async function parseInput(input) {
	const pid = await pidFromPort(input);
	return {
		pid,
		port: input
	}
}