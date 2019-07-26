import { expect } from 'chai';
import { createServer } from 'http';

import killPortProcess, { arrayifyInput, IsInputValid } from '../src/lib';

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
	describe('IsInputValid()', () => {
		describe('when input is defined', () => {
			it('should return true', () => {
				const actual = IsInputValid(1234);
				expect(actual).to.be.true;
			});
		});
		describe('when input is undefined', () => {
			it('should return false', () => {
				const input = undefined;
				const actual = IsInputValid(input);
				expect(actual).to.be.false;
			});
		});
	});
	describe('arrayifyInput()', () => {
		describe('when input is an array', () => {
			it('should return as is', () => {
				const input = [1234];

				const actual = arrayifyInput(input);
				const expected = [1234];

				expect(actual).to.deep.equal(expected);
			});
		});
		describe('when input is not of type array', () => {
			it('should arrayify input', () => {
				const input = 1234;

				const actual = arrayifyInput(input);
				const expected = [1234];

				expect(actual).to.deep.equal(expected);
			});
		});
	});
});
