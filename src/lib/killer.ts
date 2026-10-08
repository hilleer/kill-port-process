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
	protected findPids: (port: number) => Promise<number[]>;

	constructor(ports: number[], findPids = findListeningPids) {
		this.ports = ports;
		this.findPids = findPids;
	}

	public async kill(options: KillOptions) {
		// find the processes on every port before killing any, as one process may listen on several of the ports
		const pidsByPort = await Promise.all(this.ports.map((port) => this.findPids(port)));
		const pids = Array.from(new Set(pidsByPort.flat()));

		if (pids.length > 0) {
			await (platform() === 'win32' ? win32Kill(pids, options.silent) : unixKill(pids, options.signal));
		}

		const unusedPorts = this.ports.filter((_port, index) => pidsByPort[index].length === 0);
		if (unusedPorts.length > 0) {
			throw new Error(`No process found listening on port${unusedPorts.length > 1 ? 's' : ''} ${unusedPorts.join(', ')}`);
		}
	}
}

function win32Kill(pids: number[], silent: boolean) {
	const pidArgs = pids.flatMap((pid) => ['/pid', pid.toString()]);

	return new Promise((resolve, reject) => {
		const taskkill = spawn('TASKKILL', ['/f', '/t', ...pidArgs]);
		taskkill.stdout.resume();
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

function unixKill(pids: number[], signal: Signal) {
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
		throw new Error(`Failed to kill process(es): ${failures.join(', ')}`);
	}
}
