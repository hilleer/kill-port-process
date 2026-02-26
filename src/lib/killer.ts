import { spawn } from 'child_process';
import { platform } from 'os';

const importPidPort = new Function('return import("pid-port")') as () => Promise<typeof import('pid-port')>;

export type Signal = 'SIGTERM' | 'SIGKILL'

type KillOptions = {
	signal: Signal;
	silent: boolean;
}

export class Killer {
	protected ports: number[];

	constructor(ports: number[]) {
		this.ports = ports;
	}

	public async kill(options: KillOptions) {
		const killFunc = platform() === 'win32' ? this.win32Kill : this.unixKill;
		const promises = this.ports.map((port) => killFunc(port, options.signal, options.silent));

		return Promise.all(promises);
	}

	private async win32Kill(port: number, _signal: Signal, silent: boolean) {
		const { portToPid } = await importPidPort();
		const pid = await portToPid(port).catch((error: unknown) => console.error('Failed to get pid of port', port, error));

		if (!pid) {
			return;
		}

		return new Promise((resolve, reject) => {
			const taskkill = spawn('TASKKILL', ['/f', '/t', '/pid', pid.toString()]);
			taskkill.stdout.on('data', (data) => { if (!silent) { console.log(data.toString()); } });
			taskkill.stderr.on('data', (data) => { if (!silent) { console.error(data.toString()); } });
			taskkill.on('close', (code, signal) => {
				if (code !== 0) {
					return reject(`taskkill process exited with code ${code} and signal ${signal}`);
				}

				resolve(undefined);
			});
			taskkill.on('error', (err) => reject(err));
		});
	}

	private async unixKill(port: number, signal: Signal, silent: boolean) {
		const killCommand = {
			SIGKILL: '-9',
			SIGTERM: '-15'
		}[signal]

		return new Promise((resolve, reject) => {
			const lsof = spawn('lsof', ['-i', `tcp:${port}`]);
			const grep = spawn('grep', ['LISTEN']);
			const awk = spawn('awk', ['{print $2}']);
			const xargs = spawn('xargs', ['kill', killCommand]);

			lsof.stdout.pipe(grep.stdin);
			lsof.stderr.on('data', logStderrData('lsof'));

			grep.stdout.pipe(awk.stdin);
			grep.stderr.on('data', logStderrData('grep'));

			awk.stdout.pipe(xargs.stdin);
			awk.stderr.on('data', logStderrData('awk'));

			xargs.stderr.on('data', logStderrData('xargs'));
			xargs.stdout.resume();
			xargs.on('close', (code) => {
				if (code !== 0) {
					return reject();
				}

				resolve(undefined);
			});

			function logStderrData(command: string) {
				return (data: Buffer) => {
					if (!silent) {
						console.error(`${command} - ${data.toString()}`);
					}
				};
			}
		});
	}
}
