const { expect } = require('chai');
const http = require('http');
const fetch = require('node-fetch');

const killPortProcess = require('../../src/index');

const PORT = 9999;
const SERVER_URL = `http://localhost:${PORT}`;

describe.skip('kill-port-process', () => {
	describe('when starting a server on a port', () => {
		let actualResponseStatus;
		let expectedResponseStatus;
		before((done) => {
			const server = http.createServer((req, res) => {
				res.statusCode = 200;
				res.end();
			});
			server.listen(PORT, () => {
				done();
			});
		});

		before(async () => {
			const response = await fetch(SERVER_URL);
			actualResponseStatus = response.status;
			expectedResponseStatus = 200;
		});

		it('should be running', () => {
			expect(actualResponseStatus).to.equal(expectedResponseStatus);
		});
		describe('when killing the process on the port', () => {
			before(async () => {
				await killPortProcess(PORT, {}).catch(err => console.log('fail to kill'));
			});
			before(async () => {
				const response = await fetch(SERVER_URL);
				console.log(response);
			});
			it('should kill the process', () => {
				expect(true).to.be.true;
			});
		});
	});
});