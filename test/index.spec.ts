import { createServer } from 'http';
import { expect } from 'chai';

import killPortProcess, { arrayifyInput, validateInput, InvalidInputError } from '../src/lib';

describe('index', () => {
	describe.skip('when called on a port', () => {
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
	describe('validateInput()', () => {
		describe('when input is defined', () => {
			it('should not throw', () => {
				let error: any;
				
				try {
					validateInput(1234);
				} catch (err) {
					error = error;
				}
				expect(error).to.be.undefined;
			});
		});
		describe('when input is undefined', () => {
			it('should throw an error', () => {
				let error;
				
				try {
					const input = undefined;
					validateInput(input);
				} catch (err) {
					error = err;
				}
				expect(error).to.be.an.instanceof(InvalidInputError);
			});
		});
	});
	describe('arrayifyInput()', () => {
		describe('when input is an array', () => {
			it('should return as is', () => {
				const input = [1234];

				const actual = arrayifyInput(input);
				const expected = [1234];

				expect(actual).to.deep.eql(expected);
			});
		});
		describe('when input is not of type array', () => {
			it('should arrayify input', () => {
				const input = 1234;

				const actual = arrayifyInput(input);
				const expected = [1234];

				expect(actual).to.deep.eql(expected);
			});
		});
	});
});