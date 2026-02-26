import { expect } from 'chai';
import * as pidFromPort from 'pid-from-port'

import { killPortProcess } from '../src/lib/index';
import { startFakeServer } from './helpers';

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
				expect(actualError).to.be.an.instanceOf(Error);
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
				expect(actualError).to.be.an.instanceOf(Error);
			});
		});

		describe('when called with a single port', () => {
			const port = 1234;

			let actualListen: string;
			let expectedListen: string;
			before('start a fake server', (done) => startFakeServer(port, (data: Buffer) => {
				actualListen = data.toString();
				expectedListen = 'Listening on 1234';
				done();
			}));

			let actualError: unknown;
			before('kill port, make request', async () => {
				await killPortProcess(1234)

				try {
					await pidFromPort(port)
				} catch (error) {
					actualError = error;
				}
			});

			it('should actually listen on a server', () => {
				expect(actualListen).to.be.equal(expectedListen);
			});

			it('should return an error accessing port', () => {
				expect(actualError)
					.to.be.an.instanceOf(Error)
					.with.property('message')
					.that.equal(`Couldn't find a process with port \`${port}\``);
			});
		});

		describe('when called with multiple ports', () => {
			let actualListenOne: string;
			let expectedListenOne: string;
			before('start one fake server', (done) => startFakeServer(5678, (data: Buffer) => {
				actualListenOne = data.toString();
				expectedListenOne = 'Listening on 5678';
				done();
			}));

			let actualListenTwo: string;
			let expectedListenTwo: string;
			before('start second fake server', (done) => startFakeServer(6789, (data: Buffer) => {
				actualListenTwo = data.toString();
				expectedListenTwo = 'Listening on 6789';
				done();
			}));

			let actualErrors: string[];
			before('kill port, make request', async () => {
				await killPortProcess([5678, 6789]);

				const res = await Promise.allSettled([pidFromPort(5678), pidFromPort(6789)]);
				actualErrors = res.reduce<string[]>((acc, cur) => {
					if (cur.status === 'rejected') {
						acc.push(cur.reason.message);
					}

					return acc;
				}, []);
			});

			it('should actually listen on server one', () => {
				expect(actualListenOne).to.equal(expectedListenOne);
			});
			it('should actually listen on server two', () => {
				expect(actualListenTwo).to.equal(expectedListenTwo);
			});

			it('should throw an error on fetch one when sending a request to the terminated server', () => {
				const expected = [
					"Couldn't find a process with port `5678`",
					"Couldn't find a process with port `6789`",
				];

				expect(actualErrors)
					.to.have.lengthOf(2)
					.that.deep.equal(expected);
			});
		});

		describe('when called with a port with no process running on', () => {
			let actualError: Error | undefined;
			before('kill port', async () => {
				try {
					await killPortProcess(9999);
				} catch (error) {
					actualError = error as Error;
				}
			});
			it('should not throw an error', () => {
				expect(actualError).to.be.undefined;
			});
		});

		describe('when called with a single port and signal=SIGTERM', () => {
			const port = 1234;

			let actualListen: string;
			let expectedListen: string;

			before('start a fake server', (done) => startFakeServer(1234, (data: Buffer) => {
				actualListen = data.toString();
				expectedListen = 'Listening on 1234';
				done();
			}));

			let actualPortError: Error | undefined;
			before('kill port, make request', async () => {
				await killPortProcess(port, { signal: 'SIGTERM' });
				try {
					await pidFromPort(port);
				} catch (error) {
					actualPortError = error;
				}
			});

			it('should actually listen on a server', () => {
				expect(actualListen).to.be.equal(expectedListen);
			});

			it('should be true', () => {
				expect(actualPortError)
					.to.be.an.instanceOf(Error)
					.that.property('message')
					.that.equal(`Couldn't find a process with port \`${port}\``);
			});
		});
	});
});
