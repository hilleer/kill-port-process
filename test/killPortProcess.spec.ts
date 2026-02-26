import { expect } from 'chai';
import { spawn } from 'child_process';

import { startFakeServer } from './helpers';

const PORT = '9999';
const NON_EXISTENT_PORT = '59999';

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

	describe('when killing process of non-existent port', () => {
		it('should throw an error', async () => {
			const actual = await killProcess([], NON_EXISTENT_PORT);
			expect(actual).to.have.property('code').that.is.not.equal(0);
		});

		it('should be silent when silent flag is set', async () => {
			const actual = await killProcess(['--silent'], NON_EXISTENT_PORT);
			const expected = { message: 'closed', code: 0 };
			expect(actual).to.deep.equal(expected);
		});
	});
});

function killProcess(flags: string[] = [], port: string = PORT) {
	const args = [
		'dist/bin/kill-port-process',
		'--port',
		port,
		...flags
	];
	const child = spawn('node', args);

	return new Promise((resolve, reject) => {
		const resolveWithResult = (code: any, signal: any) => resolve({
			message: 'closed',
			code,
			...(signal && { signal })
		});

		child.on('close', resolveWithResult);
		child.on('exit', resolveWithResult);
		child.on('error', (err) => reject(err));
	});

}
