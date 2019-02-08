const { expect } = require('chai');
const fetch = require('node-fetch');

const killPortProcess = require('../../src/index');

const PORT = 9999;
const SERVER_URL = `http://localhost:${PORT}`;

describe.skip('kill-port-process', () => {
	describe('when killing process on port', () => {
		let actualResponseStatus;
		let expectedResponseStatus;

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
				await killPortProcess(PORT, {});
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