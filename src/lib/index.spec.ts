import assert from 'node:assert/strict';
import { ChildProcess } from 'node:child_process';
import { platform } from 'node:os';
import { before, describe, it } from 'node:test';

import { killPortProcess } from './index';
import { startFakeServer, waitForExit } from '../../test/helpers';

// taskkill /f terminates with exit code 1 rather than a signal
function assertKilledBy(exit: { code: number | null; signal: NodeJS.Signals | null }, signal: NodeJS.Signals) {
	assert.deepStrictEqual(exit, platform() === 'win32' ? { code: 1, signal: null } : { code: null, signal });
}

describe('lib/index', () => {
	describe('killPortProcess()', () => {
		describe('when called with undefined', () => {
			let actualError: unknown;
			before(async () => {
				try {
					// @ts-expect-error testing invalid input
					await killPortProcess(undefined);
				} catch (error) {
					actualError = error;
				}
			});
			it('should throw an error', () => {
				assert.ok(actualError instanceof Error);
			});
		});

		describe('when called with null', () => {
			let actualError: unknown;
			before(async () => {
				try {
					// @ts-expect-error testing invalid input
					await killPortProcess(null);
				} catch (error) {
					actualError = error;
				}
			});
			it('should throw an error', () => {
				assert.ok(actualError instanceof Error);
			});
		});

		describe('when called with a single port', () => {
			const port = 1234;

			let server: ChildProcess;
			let actualListen: string;
			let expectedListen: string;
			before(() => new Promise<void>((resolve) => {
				server = startFakeServer(port, (data: Buffer) => {
					actualListen = data.toString();
					expectedListen = 'Listening on 1234';
					resolve();
				});
			}));

			let actualExit: Awaited<ReturnType<typeof waitForExit>>;
			before(async () => {
				await killPortProcess(port);
				actualExit = await waitForExit(server);
			});

			it('should actually listen on a server', () => {
				assert.equal(actualListen, expectedListen);
			});

			it('should kill the server with SIGKILL', () => {
				assertKilledBy(actualExit, 'SIGKILL');
			});
		});

		describe('when called with multiple ports', () => {
			let serverOne: ChildProcess;
			let actualListenOne: string;
			let expectedListenOne: string;
			before(() => new Promise<void>((resolve) => {
				serverOne = startFakeServer(5678, (data: Buffer) => {
					actualListenOne = data.toString();
					expectedListenOne = 'Listening on 5678';
					resolve();
				});
			}));

			let serverTwo: ChildProcess;
			let actualListenTwo: string;
			let expectedListenTwo: string;
			before(() => new Promise<void>((resolve) => {
				serverTwo = startFakeServer(6789, (data: Buffer) => {
					actualListenTwo = data.toString();
					expectedListenTwo = 'Listening on 6789';
					resolve();
				});
			}));

			let actualExits: Awaited<ReturnType<typeof waitForExit>>[];
			before(async () => {
				await killPortProcess([5678, 6789]);
				actualExits = await Promise.all([waitForExit(serverOne), waitForExit(serverTwo)]);
			});

			it('should actually listen on server one', () => {
				assert.equal(actualListenOne, expectedListenOne);
			});
			it('should actually listen on server two', () => {
				assert.equal(actualListenTwo, expectedListenTwo);
			});

			it('should kill both servers', () => {
				assert.equal(actualExits.length, 2);
				actualExits.forEach((exit) => assertKilledBy(exit, 'SIGKILL'));
			});
		});

		describe('when called with a port with no process running on', () => {
			let actualError: Error | undefined;
			before(async () => {
				try {
					await killPortProcess(9997);
				} catch (error) {
					actualError = error as Error;
				}
			});
			it('should throw a readable error', () => {
				assert.ok(actualError instanceof Error);
				assert.equal(actualError.message, 'No process found listening on port 9997');
			});
		});

		describe('when called with a port with no process running on and silent=true', () => {
			let actualError: unknown;
			before(async () => {
				try {
					await killPortProcess(9998, { silent: true });
				} catch (error) {
					actualError = error;
				}
			});
			it('should not throw an error', () => {
				assert.equal(actualError, undefined);
			});
		});

		describe('when called with a single port and signal=SIGTERM', () => {
			const port = 1234;

			let server: ChildProcess;
			let actualListen: string;
			let expectedListen: string;

			before(() => new Promise<void>((resolve) => {
				server = startFakeServer(port, (data: Buffer) => {
					actualListen = data.toString();
					expectedListen = 'Listening on 1234';
					resolve();
				});
			}));

			let actualExit: Awaited<ReturnType<typeof waitForExit>>;
			before(async () => {
				await killPortProcess(port, { signal: 'SIGTERM' });
				actualExit = await waitForExit(server);
			});

			it('should actually listen on a server', () => {
				assert.equal(actualListen, expectedListen);
			});

			it('should kill the server with SIGTERM', () => {
				assertKilledBy(actualExit, 'SIGTERM');
			});
		});
	});
});
