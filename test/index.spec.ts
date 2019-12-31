import { expect } from 'chai';
import { spawn } from 'child_process';
import fetch, { FetchError } from 'node-fetch';

import { killPortProcess } from '../src/lib/index';

describe('index', () => {
	describe('killPortProcess()', () => {
		const localhost = 'http://localhost';
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
				await fetch(`${localhost}:1234/`, { method: 'GET' })
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
		describe('when called with multiple arguments', () => {
			let actualListenOne: string;
			let expectedListenOne: string;
			before('start one fake server', (done) => {
				startFakeServer(5678, (data) => {
					actualListenOne = data.toString();
					expectedListenOne = 'Listening on 5678';
					console.log('server started');
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
					fetch(`${localhost}:5678/`, { method: 'GET' })
						.catch((reason) => actualFetchErrorOne = reason),
					fetch(`${localhost}:6789`, { method: 'GET' })
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
			it('should throw an error on fetch one', () => {
				expect(actualFetchErrorOne).to.be.an.instanceOf(FetchError);
			});
			it('should throw an error on fetch two', () => {
				expect(actualFetchErrorTwo).to.be.an.instanceOf(FetchError);
			});
		});
	});
});

function startFakeServer(port: any, cb: any) {
	const child = spawn('node', ['test/fake-server.js', port]);
	child.stderr.on('data', (data) => console.log('ERR', data.toString()));
	child.stdout.on('data', (data) => cb(data));
}
