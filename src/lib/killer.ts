import * as pidFromPort from 'pid-from-port';
import { exec } from 'child_process';
import { promisify } from 'util';

import { Options } from ".";

const execAsync = promisify(exec);

export class Killer {
	private ports: number[];
	private options: Options;
	constructor(ports: number[], options: Options) {
		this.ports = ports;
		this.options = options;
	}

	public async win32Kill() {
		const promises = this.ports.map(pidFromPort);
		const pids = await Promise.all(promises);
	
		const { stdout, stderr } = await execAsync(`TASKKILL /f /t /pid ${pids.join(' ')}`);
		stderr && console.log(stderr);
		stdout && console.log(stdout);
	}

	public async unixKill() {
		const promises = this.ports.map(this.unixKillHelper);
		return Promise.all(promises);

	}

	private async unixKillHelper(input) {
		const command = `lsof -i tcp:${input} | grep LISTEN | awk '{print $2}' | xargs kill -9`;
		const { stdout, stderr } = await execAsync(command);
		stderr && console.log(stderr);
		stdout && console.log(stdout);
	}
}