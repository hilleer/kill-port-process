import { spawn } from 'child_process';
import { platform } from 'os';
import * as pidFromPort from 'pid-from-port';

import { Options } from './index';

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

	private async win32Kill(port: number) {
		const pid = await pidFromPort(port).catch((error) => console.error('Failed to get pid of port', port, error));

		if (!pid) {
			return;
		}

		return new Promise((resolve, reject) => {
			const taskkill = spawn('TASKKILL', ['/f', '/t', '/pid', pid.toString()]);
			taskkill.stdout.on('data', (data) => console.log(data.toString()));
			taskkill.stderr.on('data', (data) => console.error(data.toString()));
			taskkill.on('close', (code, signal) => {
				if (code !== 0) {
					reject(`taskkill process exited with code ${code} and signal ${signal}`);
					return;
				}
				resolve(undefined);
			});
			taskkill.on('error', (err) => reject(err));
		});
	}

	private async unixKill(port: number) {
		return new Promise((resolve, reject) => {
			const lsof = spawn('lsof', ['-i', `tcp:${port}`]);
			const grep = spawn('grep', ['LISTEN']);
			const awk = spawn('awk', ['{print $2}']);
			const xargs = spawn('xargs', ['kill', '-9']);

			lsof.stdout.pipe(grep.stdin);
			lsof.stderr.on('data', logStderrData('lsof'));

			grep.stdout.pipe(awk.stdin);
			grep.stderr.on('data', logStderrData('grep'));

			awk.stdout.pipe(xargs.stdin);
			awk.stderr.on('data', logStderrData('awk'));

			xargs.stdout.pipe(process.stdin);
			xargs.stderr.on('data', logStderrData('xargs'));
			xargs.on('close', (code) => {
				if (code !== 0) {
					reject();
					return;
				}
				resolve(undefined);
			});

			function logStderrData(command: string) {
				return (data: any) => console.error(`${command} - ${data.toString()}`);
			}
		});
	}
}
