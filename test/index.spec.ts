import { expect } from 'chai';
import * as pidFromPort from 'pid-from-port'

import { killPortProcess } from '../src/lib/index';
import { startFakeServer } from './helpers';

describe('lib/index', () => {
	describe('killPortProcess()', () => {
		describe('when called with undefined', () => {
			let actualError: any;
			before(async () => {
				try {
					// @ts-ignore
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
			let actualError: any;
			before(async () => {
				try {
					// @ts-ignore
					await killPortProcess(null);
				} catch (error) {
					actualError = error;
				}
			});
			it('should throw an error', () => {
				expect(actualError).to.be.an.instanceOf(Error);
			});
		});

		describe.only('when called with a single port', () => {
			const port = 1234;

			let actualListen: string;
			let expectedListen: string;
			before('start a fake server', (done) => startFakeServer(port, (data: any) => {
				actualListen = data.toString();
				expectedListen = 'Listening on 1234';
				done();
			}));

			let actualError: any;
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
			before('start one fake server', (done) => startFakeServer(5678, (data: any) => {
				actualListenOne = data.toString();
				expectedListenOne = 'Listening on 5678';
				done();
			}));

			let actualListenTwo: string;
			let expectedListenTwo: string;
			before('start second fake server', (done) => startFakeServer(6789, (data: any) => {
				actualListenTwo = data.toString();
				expectedListenTwo = 'Listening on 6789';
				done();
			}));

			let actualKillError: any;
			let actualFetchErrorOne: any;
			let actualFetchErrorTwo: any;
			before('kill port, make request', async () => {
				await killPortProcess([5678, 6789])
					.catch((reason) => actualKillError = reason);
				await Promise.all([
					fetch(getLocalHost(5678), { method: 'GET' })
						.catch((reason) => actualFetchErrorOne = reason),
					fetch(getLocalHost(6789), { method: 'GET' })
						.catch((reason) => actualFetchErrorTwo = reason),
				]);
			});
			it('should actually listen on server one', () => {
				expect(actualListenOne).to.equal(expectedListenOne);
			});
			it('should actually listen on server two', () => {
				expect(actualListenTwo).to.equal(expectedListenTwo);
			});
			it('should not throw an error calling killPortProcess', () => {
				expect(actualKillError).to.be.undefined;
			});
			it('should throw an error on fetch one when sending a request to the terminated server', () => {
				expect(actualFetchErrorOne)
					.to.be.an.instanceOf(TypeError)
					.that.nested.property('cause.code')
					.to.be.oneOf(['ECONNREFUSED', 'ECONNRESET']);
			});
			it('should throw an error on fetch two when sending a request to the terminated server', () => {
				expect(actualFetchErrorTwo)
					.to.be.an.instanceOf(TypeError)
					.that.nested.property('cause.code')
					.to.be.oneOf(['ECONNREFUSED', 'ECONNRESET']);
			});
		});

		describe('when called with a port with no process running on', () => {
			let actualError: any;
			before('kill port', async () => {
				try {
					await killPortProcess(9999);
				} catch (error) {
					actualError = error;
				}
			});
			it('should not throw an error', () => {
				expect(actualError).to.be.undefined;
			});
		});

		describe('when called with a single port and signal=SIGTERM', () => {
			let actualListen: string;
			let expectedListen: string;
			before('start a fake server', (done) => startFakeServer(1234, (data: any) => {
				actualListen = data.toString();
				expectedListen = 'Listening on 1234';
				done();
			}));

			let actualKillError: any;
			let actualFetchError: any;
			before('kill port, make request', async () => {
				await killPortProcess(1234, { signal: 'SIGTERM' })
					.catch((reason) => actualKillError = reason);
				await fetch(getLocalHost(1234), { method: 'GET' })
					.catch((reason) => actualFetchError = reason);
			});
			it('should actually listen on a server', () => {
				expect(actualListen).to.be.equal(expectedListen);
			});
			it('should not throw an error', () => {
				expect(actualKillError).to.be.undefined;
			});
			it('should be true', () => {
				expect(actualFetchError)
					.to.be.an.instanceOf(TypeError)
					.that.nested.property('cause.code')
					.to.be.oneOf(['ECONNREFUSED', 'ECONNRESET']);
			});
		});
	});
});

function getLocalHost(port: number | string) {
	return `http://localhost:${port}`;
}
