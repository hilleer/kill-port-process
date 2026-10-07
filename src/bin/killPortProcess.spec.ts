import assert from 'node:assert/strict';
import { ChildProcess, spawn } from 'node:child_process';
import { before, describe, it } from 'node:test';

import { findListeningPids } from '../lib/pids';
import { startFakeServer, waitForExit } from '../../test/helpers';

const PORT = '9999';
const NON_EXISTENT_PORT = '59999';

describe('bin/kill-port-process', () => {
	describe('when killing process', () => {
		let server: ChildProcess;
		before(() => new Promise<void>((resolve) => { server = startFakeServer(PORT, () => resolve()); }));

		it('should kill and return expected', async () => {
			const actual = await killProcess();
			const expected = { message: 'closed', code: 0, stderr: '' };

			assert.deepStrictEqual(actual, expected);
			await waitForExit(server);
		});
	});

	describe('when killing process with graceful flag', () => {
		let server: ChildProcess;
		before(() => new Promise<void>((resolve) => { server = startFakeServer(PORT, () => resolve()); }));

		it('should kill and return expected', async () => {
			const actual = await killProcess(['--graceful']);
			const expected = { message: 'closed', code: 0, stderr: '' };

			assert.deepStrictEqual(actual, expected);
			await waitForExit(server);
		});
	});

	describe('when killing process of non-existent port', () => {
		it('should not have a process running on the port', async () => {
			assert.deepStrictEqual(await findListeningPids(Number(NON_EXISTENT_PORT)), []);
		});

		it('should fail with a readable message', async () => {
			const actual = await killProcess([], NON_EXISTENT_PORT);
			const expected = { message: 'closed', code: 1, stderr: `No process found listening on port ${NON_EXISTENT_PORT}` };
			assert.deepStrictEqual(actual, expected);
		});

		it('should be silent when silent flag is set', async () => {
			const actual = await killProcess(['--silent'], NON_EXISTENT_PORT);
			const expected = { message: 'closed', code: 0, stderr: '' };
			assert.deepStrictEqual(actual, expected);
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

	let stderr = '';
	child.stderr.on('data', (data) => { stderr += data.toString(); });

	return new Promise((resolve, reject) => {
		child.on('close', (code, signal) => resolve({
			message: 'closed',
			code,
			stderr: stderr.trim(),
			...(signal && { signal })
		}));
		child.on('error', (err) => reject(err));
	});
}
