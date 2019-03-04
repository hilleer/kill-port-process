const pidFromPort = require('pid-from-port');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

module.exports = {
	unixKill,
	win32Kill
};

async function unixKill({ inputArray, opts }) {
	const promises = inputArray.map(killPortProcess);
	return Promise.all(promises);

	async function killPortProcess(input) {
		const command = `lsof -i tcp:${input} | grep LISTEN | awk '{print $2}' | xargs kill -9`;
		const { stdout, stderr } = await execAsync(command);
		if (stderr) { console.log(stderr); }
		if (stdout) { console.log(stdout); }
	}
}

async function win32Kill({ inputArray, opts }) {
	const pids = [];
	for (let i = 0; i < inputArray.length; i++) {
		const pid = await pidFromPort(inputArray[i]);
		pids.push(pid);
	}

	const { stdout, stderr } = await execAsync(`TASKKILL /f /t /pid ${pids.join(' ')}`);
	if (stderr) { console.log(stderr); }
	if (stdout) { console.log(stdout); }
}