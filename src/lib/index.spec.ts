import assert from 'node:assert/strict';
import { ChildProcess, spawn } from 'node:child_process';
import { platform } from 'node:os';
import { after, before, describe, it } from 'node:test';

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

		describe('when one process listens on several of the ports', () => {
			const ports = [4567, 4568];

			let server: ChildProcess;
			before(() => new Promise<void>((resolve) => {
				const script = `const http = require('http'); let listening = 0; for (const port of ${JSON.stringify(ports)}) http.createServer().listen(port, () => { if (++listening === ${ports.length}) process.stdout.write('ready'); });`;
				server = spawn(process.execPath, ['-e', script]);
				server.stdout?.once('data', () => resolve());
			}));

			let actualError: unknown;
			let actualExit: Awaited<ReturnType<typeof waitForExit>>;
			before(async () => {
				try {
					await killPortProcess(ports);
				} catch (error) {
					actualError = error;
				}
				actualExit = await waitForExit(server);
			});

			it('should not report a port as unused after killing its process through another port', () => {
				assert.equal(actualError, undefined);
			});

			it('should kill the process', () => {
				assertKilledBy(actualExit, 'SIGKILL');
			});
		});

		describe('when called with a used and an unused port', () => {
			const port = 4569;

			let server: ChildProcess;
			before(() => new Promise<void>((resolve) => { server = startFakeServer(port, () => resolve()); }));

			let actualError: unknown;
			let actualExit: Awaited<ReturnType<typeof waitForExit>>;
			before(async () => {
				try {
					await killPortProcess([port, 9996]);
				} catch (error) {
					actualError = error;
				}
				actualExit = await waitForExit(server);
			});

			it('should kill the process on the used port', () => {
				assertKilledBy(actualExit, 'SIGKILL');
			});

			it('should report only the unused port', () => {
				assert.ok(actualError instanceof Error);
				assert.equal(actualError.message, 'No process found listening on port 9996');
			});
		});

		for (const silent of [false, true]) {
			describe(`when called with a valid and an invalid port and silent=${silent}`, () => {
				const port = 4321;

				let server: ChildProcess;
				before(() => new Promise<void>((resolve) => { server = startFakeServer(port, () => resolve()); }));

				let actualError: unknown;
				before(async () => {
					try {
						await killPortProcess([String(port), 'abc'], { silent });
					} catch (error) {
						actualError = error;
					}
				});

				after(() => server.kill());

				it('should throw before killing anything', () => {
					assert.ok(actualError instanceof Error);
					assert.equal(actualError.message, 'Invalid port(s): "abc". Ports must be integers between 1 and 65535');
					assert.equal(server.exitCode, null);
					assert.equal(server.signalCode, null);
				});
			});
		}
	});
});
