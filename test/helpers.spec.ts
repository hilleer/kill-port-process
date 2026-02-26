import { expect } from 'chai';

import { arrayifyInput, mergeOptions } from '../src/lib/helpers';

describe('helpers.spec.ts', () => {
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

	describe('mergeOptions()', () => {
		describe('when called with no options', () => {
			it('should return defaults with signal=SIGKILL and silent=false', () => {
				expect(mergeOptions({})).to.deep.equal({ signal: 'SIGKILL', silent: false });
			});
		});
		describe('when called with silent: true', () => {
			it('should override the silent default', () => {
				expect(mergeOptions({ silent: true })).to.deep.equal({ signal: 'SIGKILL', silent: true });
			});
		});
	});
});