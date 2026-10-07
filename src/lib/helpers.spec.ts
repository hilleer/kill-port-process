import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { arrayifyInput, mergeOptions } from './helpers';

describe('helpers.spec.ts', () => {
	describe('arrayifyInput()', () => {
		describe('when input is an array', () => {
			it('should return as is', () => {
				const input = [1234];

				const actual = arrayifyInput(input);
				const expected = [1234];

				assert.deepStrictEqual(actual, expected);
			});
		});
		describe('when input is not of type array', () => {
			it('should arrayify input', () => {
				const input = 1234;

				const actual = arrayifyInput(input);
				const expected = [1234];

				assert.deepStrictEqual(actual, expected);
			});
		});
	});

	describe('mergeOptions()', () => {
		describe('when called with no options', () => {
			it('should return defaults with signal=SIGKILL and silent=false', () => {
				assert.deepStrictEqual(mergeOptions({}), { signal: 'SIGKILL', silent: false });
			});
		});
		describe('when called with silent: true', () => {
			it('should override the silent default', () => {
				assert.deepStrictEqual(mergeOptions({ silent: true }), { signal: 'SIGKILL', silent: true });
			});
		});
	});
});
