import { expect } from 'chai';
import { spawn } from 'child_process';
import fetch, { FetchError } from 'node-fetch';

import killPortProcess from '../src/lib/index';

describe('index', () => {
	describe('lala', () => {
		let actualListen: string;
		let expectedListen: string;
		before('start a fake server', (done) => {
			const child = spawn('node', ['test/fake-server.js']);
			child.stdout.on('data', (data) => {
				actualListen = data.toString();
				expectedListen = 'Listening on 1234';
				done();
			});
			child.stderr.on('data', (data) => {
				console.log('stderr', data.toString());
			});
		});
		let actualFetchError: FetchError;
		before('kill port, make request', async () => {
			await killPortProcess(1234);
			await fetch(`http://localhost:1234/`, { method: 'GET' })
				.catch((reason) => actualFetchError = reason);
		});
		it('should actually listen on a server', () => {
			expect(actualListen).to.be.equal(expectedListen);
		});
		it('should be true', () => {
			expect(actualFetchError).to.be.an.instanceOf(FetchError);
		});
	});
});
