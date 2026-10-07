import assert from 'node:assert/strict';
import { after, afterEach, before, describe, it } from 'node:test';
import { chmod, mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

import { findListeningPids } from './pids';
import { startFakeServer } from '../../test/helpers';

const PORT = 7654;

describe('lib/pids', function () {
	if (process.platform !== 'linux') {
		return;
	}

	describe('findListeningPids()', () => {
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
			before(() => new Promise<void>((resolve) => startFakeServer(PORT, () => resolve())));

			let actualPids: number[];
			before(async () => {
				const fakeLsof = join(binDir, 'lsof');
				await writeFile(fakeLsof, '#!/bin/sh\nexit 1\n');
				await chmod(fakeLsof, 0o755);

				process.env.PATH = `${binDir}:${originalPath}`;
				actualPids = await findListeningPids(PORT);
			});

			after(() => actualPids.forEach((pid) => process.kill(pid)));

			it('should fall back to ss', () => {
				assert.equal(actualPids.length, 1);
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
