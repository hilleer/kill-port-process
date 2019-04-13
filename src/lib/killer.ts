import * as pidFromPort from 'pid-from-port';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';

import { Options } from ".";

const execAsync = promisify(exec);

export class Killer {
	protected ports: number[];
	protected options: Options;
	protected platform: NodeJS.Platform;
	constructor(ports: number[], options: Options, platform) {
		this.ports = ports;
		this.options = options;
		this.platform = platform
	}

	public async kill() {
		const killFunc = this.platform === 'win32' ? this.win32Kill : this.unixKill;
		const promises = this.ports.map(killFunc);
		return Promise.all(promises);
	}

	private async win32Kill(port) {
		const pid = await pidFromPort(port).catch(Promise.reject(`Failed to kill port ${port}`));
		const { stdout, stderr } = await execAsync(`TASKKILL /f /t /pid ${pid}`);
		stderr && console.log(stderr);
		stdout && console.log(stdout);
	}

	private async unixKill(port) {
		const { stdout, stderr } = await execAsync(`lsof -i tcp:${port} | grep LISTEN | awk '{print $2}' | xargs kill -9`);
		stderr && console.log(stderr);
		stdout && console.log(stdout);
	}
}