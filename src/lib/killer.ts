import { exec } from 'child_process';
import * as pidFromPort from 'pid-from-port';
import { promisify } from 'util';

import { Options } from "./helpers";

const execAsync = promisify(exec);

export class Killer {
	protected ports: number[];
	protected options: Options;
	protected platform: NodeJS.Platform;
	constructor(ports: number[], options: Options, platform) {
		this.ports = ports;
		this.options = options;
		this.platform = platform;
	}

	public async kill() {
		const killFunc = this.platform === 'win32' ? this.win32Kill : this.unixKill;
		const promises = this.ports.map(killFunc);
		return Promise.all(promises).catch((err) => console.log('ERR!', err));
	}

	private async win32Kill(port) {
		const pid = await pidFromPort(port);
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
