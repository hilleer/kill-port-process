import { ChildProcess, spawn } from 'child_process';

export function startFakeServer(port: number | string, cb: (data: Buffer) => void): ChildProcess {
	const child = spawn('node', ['test/fake-server.js', String(port)]);
	child.stderr.on('data', (data) => console.log('ERR', data.toString()));
	child.stdout.on('data', (data) => cb(data));
	return child;
}

type Exit = { code: number | null; signal: NodeJS.Signals | null };

export function waitForExit(child: ChildProcess, timeoutMs = 5000): Promise<Exit> {
	if (child.exitCode !== null || child.signalCode !== null) {
		return Promise.resolve({ code: child.exitCode, signal: child.signalCode });
	}

	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			child.kill('SIGKILL');
			reject(new Error(`Process ${child.pid} did not exit within ${timeoutMs}ms`));
		}, timeoutMs);
		child.once('exit', (code, signal) => {
			clearTimeout(timer);
			resolve({ code, signal });
		});
	});
}
