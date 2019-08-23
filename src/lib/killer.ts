import { exec } from 'child_process';
import { platform } from 'os';
import * as pidFromPort from 'pid-from-port';

import { Options } from "./helpers";

export class Killer {
	protected ports: number[];
	protected options: Options;
	constructor(ports: number[], options: Options) {
		this.ports = ports;
		this.options = options;
	}

	public async kill() {
		const killFunc = platform() === 'win32' ? this.win32Kill : this.unixKill;
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
