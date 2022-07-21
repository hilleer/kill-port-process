import { spawn } from 'child_process';

export function startFakeServer(port: any, cb: any) {
	const child = spawn('node', ['test/fake-server.js', port]);
	child.stderr.on('data', (data) => console.log('ERR', data.toString()));
	child.stdout.on('data', (data) => cb(data));
}