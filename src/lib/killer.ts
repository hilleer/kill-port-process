import { spawn } from 'child_process';
import { platform } from 'os';
import { findListeningPids } from './pids';

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
		const pids = await findListeningPids(port);

		if (pids.length === 0) {
			throw new Error(`No process found listening on port ${port}`);
		}

		const pidArgs = pids.flatMap((pid) => ['/pid', pid.toString()]);

		return new Promise((resolve, reject) => {
			const taskkill = spawn('TASKKILL', ['/f', '/t', ...pidArgs]);
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

	private async unixKill(port: number, signal: Signal, _silent: boolean) {
		const pids = await findListeningPids(port);

		if (pids.length === 0) {
			throw new Error(`No process found listening on port ${port}`);
		}

		const failures: string[] = [];
		for (const pid of pids) {
			try {
				process.kill(pid, signal);
			} catch (error) {
				const { code } = error as NodeJS.ErrnoException;
				// process exited between lookup and kill
				if (code !== 'ESRCH') {
					failures.push(`${pid} (${code})`);
				}
			}
		}

		if (failures.length > 0) {
			throw new Error(`Failed to kill process(es) on port ${port}: ${failures.join(', ')}`);
		}
	}
}
