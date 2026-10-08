import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';

import { Killer } from './killer';

describe('lib/killer', function () {
	// windows kills through taskkill rather than process.kill
	if (process.platform === 'win32') {
		return;
	}

	describe('kill()', () => {
		afterEach(() => mock.restoreAll());

		it('finds the processes on every port before killing any, and kills a shared process once', async () => {
			const pid = 424242;
			const kill = mock.method(process, 'kill', () => true);
			// once the shared process is killed, the slower lookup of the second port no longer finds it
			const findPids = async (port: number) => {
				if (port === 2) {
					await new Promise((resolve) => setTimeout(resolve, 10));
				}
				return kill.mock.callCount() > 0 ? [] : [pid];
			};

			await new Killer([1, 2], findPids).kill({ signal: 'SIGKILL', silent: false });

			assert.deepEqual(kill.mock.calls.map((call) => call.arguments), [[pid, 'SIGKILL']]);
		});

		it('kills the processes found before reporting the unused ports', async () => {
			const kill = mock.method(process, 'kill', () => true);
			const findPids = async (port: number) => port === 1 ? [111] : [];

			await assert.rejects(new Killer([1, 2, 3], findPids).kill({ signal: 'SIGTERM', silent: false }), { message: 'No process found listening on ports 2, 3' });
			assert.deepEqual(kill.mock.calls.map((call) => call.arguments), [[111, 'SIGTERM']]);
		});

		it('kills nothing when a lookup fails', async () => {
			const kill = mock.method(process, 'kill', () => true);
			const findPids = async (port: number) => {
				if (port === 2) {
					throw new Error('lookup failed');
				}
				return [111];
			};

			await assert.rejects(new Killer([1, 2], findPids).kill({ signal: 'SIGKILL', silent: false }), { message: 'lookup failed' });
			assert.equal(kill.mock.callCount(), 0);
		});
	});
});
