import { expect } from 'chai';
import { createServer } from 'http';
import { spawn } from 'child_process';

import killPortProcess from '../src/lib/index';

describe('index', () => {
	describe.skip('when called on a port', () => {
		const PORT = 1234;

		before((done) => {
			createServer((req, res) => res.end())
				.listen(PORT, () => done());
		});
		it('should kill port', async () => {
			let actualError;
			try {
				await killPortProcess(PORT);
			} catch (error) {
				actualError = error;
			}
			expect(actualError).to.be.undefined;
		});
	});
});
