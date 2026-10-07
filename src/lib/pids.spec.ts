import assert from 'node:assert/strict';
import { after, afterEach, before, describe, it } from 'node:test';
import { chmod, mkdtemp, rm, writeFile } from 'fs/promises';
import { ChildProcess } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';

import { findListeningPids, Lookup, parseNetstat, parseSs, runLookups } from './pids';
import { startFakeServer } from '../../test/helpers';

const PORT = 7654;

// A lookup running a node script, so the exit code and output of a command can be faked on any platform
function nodeLookup(script: string, successCodes?: number[]): Lookup {
	return {
		command: process.execPath,
		args: ['-e', script],
		parse: (output) => output.split(/\s+/).filter(Boolean).map(Number),
		successCodes,
	};
}

function missingLookup(command: string): Lookup {
	return { command, args: [], parse: () => [] };
}

async function getError(promise: Promise<unknown>): Promise<Error> {
	try {
		await promise;
	} catch (error) {
		assert.ok(error instanceof Error);
		return error;
	}
	throw new Error('Expected promise to reject');
}

describe('lib/pids', function () {
	describe('runLookups()', () => {
		it('returns the pids of the first lookup finding any', async () => {
			assert.deepEqual(await runLookups(PORT, [nodeLookup('process.exit(0)'), nodeLookup('console.log("123 456")')]), [123, 456]);
		});

		it('treats an accepted non-zero exit code as no match (lsof exits 1)', async () => {
			assert.deepEqual(await runLookups(PORT, [nodeLookup('process.exit(1)', [0, 1])]), []);
		});

		it('falls back past a failing lookup', async () => {
			assert.deepEqual(await runLookups(PORT, [nodeLookup('process.stderr.write("denied"); process.exit(2)', [0, 1]), nodeLookup('console.log("789")')]), [789]);
		});

		it('falls back past a missing lookup', async () => {
			assert.deepEqual(await runLookups(PORT, [missingLookup('kpp-missing-lsof'), nodeLookup('console.log("789")')]), [789]);
		});

		it('reports no match when one lookup succeeds and another fails', async () => {
			assert.deepEqual(await runLookups(PORT, [nodeLookup('process.exit(1)', [0, 1]), nodeLookup('process.exit(2)')]), []);
		});

		it('throws the diagnostics of every failing lookup rather than reporting no match', async () => {
			const error = await getError(runLookups(PORT, [
				nodeLookup('process.stderr.write("lsof: permission denied\\n"); process.exit(2)', [0, 1]),
				nodeLookup('process.stderr.write("ss: invalid option\\n"); process.exit(2)'),
			]));
			assert.match(error.message, new RegExp(`^Unable to find processes on port ${PORT}: `));
			assert.match(error.message, /lsof: permission denied/);
			assert.match(error.message, /ss: invalid option/);
			assert.match(error.message, /exited with code 2.*exited with code 2/);
			assert.doesNotMatch(error.message, /install/);
		});

		it('reports a failing lookup without stderr by its exit code', async () => {
			const error = await getError(runLookups(PORT, [nodeLookup('process.exit(3)')]));
			assert.equal(error.message, `Unable to find processes on port ${PORT}: ${process.execPath} exited with code 3`);
		});

		it('reports missing commands alongside failures without asking to install them', async () => {
			const error = await getError(runLookups(PORT, [missingLookup('kpp-missing-lsof'), nodeLookup('process.stderr.write("denied"); process.exit(1)')]));
			assert.equal(error.message, `Unable to find processes on port ${PORT}: ${process.execPath} exited with code 1: denied; kpp-missing-lsof is not installed`);
		});

		it('asks to install the commands when none of them are installed', async () => {
			const error = await getError(runLookups(PORT, [missingLookup('kpp-missing-lsof'), missingLookup('kpp-missing-ss')]));
			assert.equal(error.message, `Unable to find processes on port ${PORT}: install kpp-missing-lsof or kpp-missing-ss`);
		});

		it('drains large stderr output without blocking, keeping only its start', async () => {
			const lookup = nodeLookup('process.stderr.write("x".repeat(8 * 1024 * 1024), () => { process.stdout.write("2468"); process.exit(2); })');
			const error = await getError(runLookups(PORT, [lookup]));
			assert.ok(error.message.length < 2000);

			const succeeding = nodeLookup('process.stderr.write("x".repeat(8 * 1024 * 1024), () => process.stdout.write("2468"))');
			assert.deepEqual(await runLookups(PORT, [succeeding]), [2468]);
		});
	});

	describe('parseNetstat()', () => {
		const fixture = [
			'',
			'Active Connections',
			'',
			'  Proto  Local Address          Foreign Address        State           PID',
			'  TCP    0.0.0.0:7654           0.0.0.0:0              LISTENING       1111',
			'  TCP    [::]:7654              [::]:0                 LISTENING       2222',
			'  TCP    127.0.0.1:7654         127.0.0.1:50000        ESTABLISHED     3333',
			'  TCP    127.0.0.1:50000        127.0.0.1:7654         ESTABLISHED     4444',
			'  TCP    0.0.0.0:17654          0.0.0.0:0              LISTENING       5555',
			'  TCP    0.0.0.0:76540          0.0.0.0:0              LISTENING       6666',
			'  UDP    0.0.0.0:7654           *:*                                    7777',
			'  UDP    [::]:7654              *:*                                    8888',
			'  UDP    0.0.0.0:17654          *:*                                    9999',
		].join('\r\n');

		it('matches TCP listeners and UDP bindings on IPv4 and IPv6, but not connections or other ports', () => {
			assert.deepEqual(parseNetstat(fixture, PORT), [1111, 2222, 7777, 8888]);
		});

		it('matches a single UDP binding', () => {
			assert.deepEqual(parseNetstat('UDP 0.0.0.0:7654 *:* 2468', PORT), [2468]);
		});

		it('matches TCP listeners on a specific interface', () => {
			assert.deepEqual(parseNetstat('  TCP    127.0.0.1:7654         0.0.0.0:0              LISTENING       2468', PORT), [2468]);
		});

		it('does not depend on the localized state column', () => {
			assert.deepEqual(parseNetstat('  TCP    0.0.0.0:7654           0.0.0.0:0              ABHÖREN         2468', PORT), [2468]);
		});

		it('returns every matching pid once', () => {
			const output = [
				'  TCP    0.0.0.0:7654           0.0.0.0:0              LISTENING       2468',
				'  TCP    [::]:7654              [::]:0                 LISTENING       2468',
				'  UDP    0.0.0.0:7654           *:*                                    2468',
				'  TCP    127.0.0.1:7654         0.0.0.0:0              LISTENING       1357',
			].join('\r\n');
			assert.deepEqual(parseNetstat(output, PORT), [2468, 1357]);
		});

		it('returns nothing when no row matches', () => {
			assert.deepEqual(parseNetstat(fixture, 1234), []);
		});
	});

	describe('parseSs()', () => {
		it('returns every pid of the users column once', () => {
			const output = `LISTEN 0 511 *:${PORT} *:* users:(("node",pid=111,fd=18),("node",pid=222,fd=18))\nLISTEN 0 511 [::]:${PORT} [::]:* users:(("node",pid=111,fd=19))`;
			assert.deepEqual(parseSs(output), [111, 222]);
		});

		it('ignores a process name containing pid=', () => {
			assert.deepEqual(parseSs(`LISTEN 0 511 *:${PORT} *:* users:(("pid=12345",pid=67890,fd=18))`), [67890]);
		});
	});

	describe('findListeningPids()', () => {
		if (process.platform !== 'linux') {
			return;
		}

		const originalPath = process.env.PATH;
		let binDir: string;

		before(async () => {
			binDir = await mkdtemp(join(tmpdir(), 'kill-port-process-'));
		});

		afterEach(() => {
			process.env.PATH = originalPath;
		});

		after(() => rm(binDir, { recursive: true, force: true }));

		describe('when lsof reports nothing', () => {
			let server: ChildProcess;
			before(() => new Promise<void>((resolve) => { server = startFakeServer(PORT, () => resolve()); }));

			let actualPids: number[];
			before(async () => {
				const fakeLsof = join(binDir, 'lsof');
				await writeFile(fakeLsof, '#!/bin/sh\nexit 1\n');
				await chmod(fakeLsof, 0o755);

				process.env.PATH = `${binDir}:${originalPath}`;
				actualPids = await findListeningPids(PORT);
			});

			after(() => server.kill());

			it('should fall back to ss', () => {
				assert.equal(actualPids.length, 1);
			});
		});

		describe('when ss reports a process name containing pid=', () => {
			let actualPids: number[];
			before(async () => {
				const fakeLsof = join(binDir, 'lsof');
				await writeFile(fakeLsof, '#!/bin/sh\nexit 1\n');
				await chmod(fakeLsof, 0o755);

				const fakeSs = join(binDir, 'ss');
				await writeFile(fakeSs, `#!/bin/sh\necho 'LISTEN 0 511 *:${PORT} *:* users:(("pid=12345",pid=67890,fd=18))'\n`);
				await chmod(fakeSs, 0o755);

				process.env.PATH = `${binDir}:${originalPath}`;
				actualPids = await findListeningPids(PORT);
			});

			after(() => rm(join(binDir, 'ss')));

			it('should only return the actual pid', () => {
				assert.deepEqual(actualPids, [67890]);
			});
		});

		describe('when lsof and ss both fail', () => {
			let actualError: unknown;
			before(async () => {
				const fakeLsof = join(binDir, 'lsof');
				await writeFile(fakeLsof, '#!/bin/sh\necho "lsof: permission denied" >&2\nexit 2\n');
				await chmod(fakeLsof, 0o755);

				const fakeSs = join(binDir, 'ss');
				await writeFile(fakeSs, '#!/bin/sh\necho "ss: invalid option" >&2\nexit 2\n');
				await chmod(fakeSs, 0o755);

				process.env.PATH = `${binDir}:${originalPath}`;
				try {
					await findListeningPids(PORT);
				} catch (error) {
					actualError = error;
				}
			});

			after(() => rm(join(binDir, 'ss')));

			it('should throw the diagnostics of both rather than report no process', () => {
				assert.ok(actualError instanceof Error);
				assert.equal(actualError.message, `Unable to find processes on port ${PORT}: lsof exited with code 2: lsof: permission denied; ss exited with code 2: ss: invalid option`);
			});
		});

		describe('when lsof fails and ss is not installed', () => {
			let actualError: unknown;
			before(async () => {
				const fakeLsof = join(binDir, 'lsof');
				await writeFile(fakeLsof, '#!/bin/sh\necho "lsof: permission denied" >&2\nexit 2\n');
				await chmod(fakeLsof, 0o755);

				// only the fake lsof is on the PATH, so ss is missing
				process.env.PATH = binDir;
				try {
					await findListeningPids(PORT);
				} catch (error) {
					actualError = error;
				}
			});

			it('should report the failure and the missing command', () => {
				assert.ok(actualError instanceof Error);
				assert.equal(actualError.message, `Unable to find processes on port ${PORT}: lsof exited with code 2: lsof: permission denied; ss is not installed`);
			});
		});

		describe('when neither lsof nor ss is installed', () => {
			let actualError: unknown;
			before(async () => {
				process.env.PATH = join(binDir, 'empty');
				try {
					await findListeningPids(PORT);
				} catch (error) {
					actualError = error;
				}
			});

			it('should throw a readable error', () => {
				assert.ok(actualError instanceof Error);
				assert.equal(actualError.message, `Unable to find processes on port ${PORT}: install lsof or ss`);
			});
		});
	});
});
