import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { arrayifyInput, mergeOptions, toPorts } from './helpers';

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

	describe('toPorts()', () => {
		it('should accept integers and numeric strings between 1 and 65535', () => {
			assert.deepStrictEqual(toPorts([1, '80', 65535, '65535', '08080']), [1, 80, 65535, 65535, 8080]);
		});

		for (const value of ['', ' ', 'abc', '80abc', ' 80', '80.5', '1e3', '0x50', '+80', '-80', '0', '65536', 0, -1, 65536, 80.5, NaN, Infinity, true, null, {}]) {
			it(`should reject ${typeof value === 'string' ? JSON.stringify(value) : String(value)}`, () => {
				assert.throws(() => toPorts([value]), { message: /^Invalid port\(s\): .+\. Ports must be integers between 1 and 65535$/ });
			});
		}

		it('should reject the holes of a sparse array', () => {
			const ports = [1234];
			ports.length = 2;
			assert.throws(() => toPorts(ports), { message: 'Invalid port(s): undefined. Ports must be integers between 1 and 65535' });
		});

		it('should list every invalid port', () => {
			assert.throws(() => toPorts([80, 'abc', 0, '']), { message: 'Invalid port(s): "abc", 0, "". Ports must be integers between 1 and 65535' });
		});
	});
});
