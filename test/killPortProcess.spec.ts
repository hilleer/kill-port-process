import { expect } from 'chai';
import { spawn } from 'child_process';

import { startFakeServer } from './helpers';

const importPidPort = new Function('return import("pid-port")') as () => Promise<typeof import('pid-port')>;

const PORT = '9999';
const NON_EXISTENT_PORT = '59999';

describe('bin/kill-port-process', () => {
	describe('when killing process', () => {
		before('start fake server', (done) => startFakeServer(PORT, (_data: Buffer) => done()));

		it('should kill and return expected', async () => {
			const actual = await killProcess();
			const expected = { message: 'closed', code: 0 };

			expect(actual).to.deep.equal(expected)
		});
	});

	describe('when killing process with graceful flag', () => {
		before('start fake server', (done) => startFakeServer(PORT, (_data: Buffer) => done()));

		it('should kill and return expected', async () => {
			const actual = await killProcess(['--graceful']);
			const expected = { message: 'closed', code: 0 };

			expect(actual).to.deep.equal(expected)
		});
	});

	describe('when killing process of non-existent port', () => {
		let portError: unknown;
		before('attempt kill, verify port is not in use', async () => {
			await killProcess([], NON_EXISTENT_PORT);
			const { portToPid } = await importPidPort();
			try {
				await portToPid(Number(NON_EXISTENT_PORT));
			} catch (error) {
				portError = error;
			}
		});

		it('should not have a process running on the port', () => {
			expect(portError)
				.to.be.instanceOf(Error)
				.with.property('message')
				.that.equals(`Could not find a process that uses port \`${NON_EXISTENT_PORT}\``);
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
		const resolveWithResult = (code: number | null, signal: NodeJS.Signals | null) => resolve({
			message: 'closed',
			code,
			...(signal && { signal })
		});

		child.on('close', resolveWithResult);
		child.on('exit', resolveWithResult);
		child.on('error', (err) => reject(err));
	});

}
