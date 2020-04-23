import { expect } from 'chai';
import { spawn } from 'child_process';
import fetch, { FetchError } from 'node-fetch';

import { killPortProcess } from '../src/lib/index';

describe('index', () => {
	describe('killPortProcess()', () => {
		describe('when called with a single port', () => {
			let actualListen: string;
			let expectedListen: string;
			before('start a fake server', (done) => {
				startFakeServer(1234, (data) => {
					actualListen = data.toString();
					expectedListen = 'Listening on 1234';
					done();
				});
			});
			let actualKillError: any;
			let actualFetchError: FetchError;
			before('kill port, make request', async () => {
				await killPortProcess(1234)
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
				expect(actualFetchError).to.be.an.instanceOf(FetchError);
			});
		});
		describe('when called with multiple ports', () => {
			let actualListenOne: string;
			let expectedListenOne: string;
			before('start one fake server', (done) => {
				startFakeServer(5678, (data) => {
					actualListenOne = data.toString();
					expectedListenOne = 'Listening on 5678';
					done();
				});
			});
			let actualListenTwo: string;
			let expectedListenTwo: string;
			before('start second fake server', (done) => {
				startFakeServer(6789, (data) => {
					actualListenTwo = data.toString();
					expectedListenTwo = 'Listening on 6789';
					done();
				});
			});
			let actualKillError: any;
			let actualFetchErrorOne: FetchError;
			let actualFetchErrorTwo: FetchError;
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
				expect(actualFetchErrorOne).to.be.an.instanceOf(FetchError);
			});
			it('should throw an error on fetch two when sending a request to the terminated server', () => {
				expect(actualFetchErrorTwo).to.be.an.instanceOf(FetchError);
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
	});
});

function startFakeServer(port: any, cb: any) {
	const child = spawn('node', ['test/fake-server.js', port]);
	child.stderr.on('data', (data) => console.log('ERR', data.toString()));
	child.stdout.on('data', (data) => cb(data));
}

function getLocalHost(port: number | string) {
	return `http://localhost:${port}`;
}