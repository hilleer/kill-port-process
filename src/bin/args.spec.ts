import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseArgs } from './args';

describe('CLI arguments', () => {
	it('accepts positional ports and port options together', () => {
		assert.deepStrictEqual(parseArgs(['1234', '-p', '2345', '--port=3456', '4567']), { ports: ['1234', '2345', '3456', '4567'], options: {} });
	});

	it('accepts the documented flags', () => {
		assert.deepStrictEqual(parseArgs(['--graceful', '--silent', '--port', '1234']), { ports: ['1234'], options: { signal: 'SIGTERM', silent: true } });
	});

	it('allows explicit false boolean flags', () => {
		assert.deepStrictEqual(parseArgs(['--graceful=false', '--silent=false', '1234']), { ports: ['1234'], options: { signal: 'SIGKILL', silent: false } });
	});

	it('rejects missing port values', () => {
		assert.throws(() => parseArgs(['--port', '--silent']), { message: 'Missing port after --port' });
		assert.throws(() => parseArgs(['-p=']), { message: 'Missing port after -p' });
	});

	it('rejects unsupported options', () => {
		assert.throws(() => parseArgs(['--unknown', '1234']), { message: 'Unknown option: --unknown' });
	});

	it('accepts --graceful before a positional port', () => {
		assert.deepStrictEqual(parseArgs(['--graceful', '1234']), { ports: ['1234'], options: { signal: 'SIGTERM' } });
	});

	it('accepts repeated port options', () => {
		assert.deepStrictEqual(parseArgs(['-p', '1234', '-p', '2345']), { ports: ['1234', '2345'], options: {} });
	});

	describe('compatibility with get-them-args', () => {
		for (const [args, expected] of [
			[['--silent', 'false', '-p', '1234'], { ports: ['1234'], options: { silent: false } }],
			[['--silent', 'true', '1234'], { ports: ['1234'], options: { silent: true } }],
			[['--graceful', 'false', '1234'], { ports: ['1234'], options: { signal: 'SIGKILL' } }],
			[['--graceful', 'true', '1234'], { ports: ['1234'], options: { signal: 'SIGTERM' } }],
			[['--no-graceful', '1234'], { ports: ['1234'], options: { signal: 'SIGKILL' } }],
			[['--no-silent', '1234'], { ports: ['1234'], options: { silent: false } }],
			[['--silent', '--no-silent', '1234'], { ports: ['1234'], options: { silent: false } }],
			[['-p', '[1234,2345]'], { ports: ['1234', '2345'], options: {} }],
			[['--port=["1234", 2345]'], { ports: ['1234', '2345'], options: {} }],
			[['[1234,2345]', '3456'], { ports: ['1234', '2345', '3456'], options: {} }],
		] as const) {
			it(`parses ${args.join(' ')}`, () => {
				assert.deepStrictEqual(parseArgs([...args]), expected);
			});
		}

		it('leaves values that are not a JSON array of ports to port validation', () => {
			assert.deepStrictEqual(parseArgs(['-p', '[1234,']), { ports: ['[1234,'], options: {} });
			assert.deepStrictEqual(parseArgs(['-p', '[]']), { ports: ['[]'], options: {} });
			assert.deepStrictEqual(parseArgs(['-p', '[{}]']), { ports: ['[{}]'], options: {} });
		});

		it('rejects values on negated flags', () => {
			assert.throws(() => parseArgs(['--no-silent=true', '1234']), { message: 'Unknown option: --no-silent=true' });
		});

		it('rejects single-dash long options', () => {
			assert.throws(() => parseArgs(['-port', '1234']), { message: 'Unknown option: -port' });
			assert.throws(() => parseArgs(['-silent', '1234']), { message: 'Unknown option: -silent' });
			assert.throws(() => parseArgs(['--p', '1234']), { message: 'Unknown option: --p' });
		});

		it('rejects negated port options', () => {
			assert.throws(() => parseArgs(['--no-port', '1234']), { message: 'Unknown option: --no-port' });
		});

		it('does not treat other words as boolean values', () => {
			assert.deepStrictEqual(parseArgs(['--silent', 'toString']), { ports: ['toString'], options: { silent: true } });
		});
	});
});
