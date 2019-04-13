import { createServer } from 'http';
import { expect } from 'chai';

import killPortProcess from '../src/lib';

describe('index', () => {
	describe('when called on a port', () => {
		const PORT = 1234;

		before((done) => {
			createServer((req, res) => res.end())
				.listen(PORT, () => done());
		});
		it('should kill port', async function() {
			let actualError;
			try {
				await killPortProcess(PORT)
			} catch (error) {
				actualError = error;
			}
			expect(actualError).to.be.undefined;
		});
	});
});