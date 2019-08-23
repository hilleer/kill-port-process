import { exec } from 'child_process';
import * as pidFromPort from 'pid-from-port';

import { Options } from "./helpers";

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
		return Promise.all(promises);
	}

	private async win32Kill(port) {
		const pid = await pidFromPort(port);
		return new Promise((resolve, reject) => {
			exec(`TASKKILL /f /t /pid ${pid}`, (err, stdout, stderr) => {
				if (err) {
					reject(err);
					return;
				}
				stderr && console.log(stderr);
				stdout && console.log(stdout);
				resolve();
			});
		});
	}

	private async unixKill(port) {
		return new Promise((resolve, reject) => {
			exec(`lsof -i tcp:${port} | grep LISTEN | awk '{print $2}' | xargs kill -9`, (err, stdout, stderr) => {
				if (err) {
					reject(err);
					return;
				}
				stderr && console.log(stderr);
				stdout && console.log(stdout);
				resolve();
			});
		});
	}
}
