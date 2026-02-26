import { spawn } from 'child_process';

export function startFakeServer(port: number | string, cb: (data: Buffer) => void) {
	const child = spawn('node', ['test/fake-server.js', String(port)]);
	child.stderr.on('data', (data) => console.log('ERR', data.toString()));
	child.stdout.on('data', (data) => cb(data));
}