import { expect } from 'chai';
import { spawn } from 'child_process';

import { startFakeServer } from './helpers';

const PORT = '9999';

describe('bin/kill-port-process', () => {
	describe('when killing process', () => {
		before('start fake server', (done) => startFakeServer(PORT, (data: any) => done()));

		it('should kill and return expected', async () => {
			const actual = await killProcess();
			const expected = { message: 'closed', code: 0 };

			expect(actual).to.deep.equal(expected)
		});
	});

	describe('when killing process with graceful flag', () => {
		before('start fake server', (done) => startFakeServer(PORT, (data: any) => done()));

		it('should kill and return expected', async () => {
			const actual = await killProcess(['--graceful']);
			const expected = { message: 'closed', code: 0 };

			expect(actual).to.deep.equal(expected)
		});
	});
});

function killProcess(flags: string[] = []) {
	const args = [
		'dist/bin/kill-port-process',
		'--port',
		PORT,
		...flags
	];
	const child = spawn('node', args);

	return new Promise((resolve, reject) => {
		child.on('close', (code, signal) => resolve({ message: 'closed', code }));
		child.on('exit', (code, signal) => resolve({ message: 'closed', code }));
		child.on('error', (err) => reject(err));
	});

}
