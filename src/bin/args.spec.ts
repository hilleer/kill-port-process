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
});
