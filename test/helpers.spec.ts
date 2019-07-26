import { expect } from 'chai';

import { arrayifyInput, IsInputValid } from '../src/lib/helpers';

describe('helpers', () => {
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
