import assert from 'node:assert/strict';
import { spawn, ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { platform } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const cliPath = join(process.cwd(), 'dist/bin/kill-port-process.js');
const serverPath = join(process.cwd(), 'test/cli-server.js');
const unusedPort = '59999';

// Bound waits on server exit so a regression fails instead of hanging the run
function withTimeout<T>(promise: Promise<T>, ms = 5000): Promise<T> {
	let timer: NodeJS.Timeout;
	const timeout = new Promise<never>((_resolve, reject) => {
		timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms waiting for server to exit`)), ms);
	});
	return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

type CliResult = { code: number | null; signal: NodeJS.Signals | null; stdout: string; stderr: string };

function runCli(args: string[]): Promise<CliResult> {
	return new Promise((resolve, reject) => {
		const child = spawn(process.execPath, [cliPath, ...args]);
		let stdout = '';
		let stderr = '';
		child.stdout.on('data', (data) => { stdout += data.toString(); });
		child.stderr.on('data', (data) => { stderr += data.toString(); });
		child.on('error', reject);
		child.on('close', (code, signal) => resolve({ code, signal, stdout, stderr: stderr.trim() }));
	});
}

async function startServer(): Promise<{ child: ChildProcess; port: string; output: () => string; closed: Promise<unknown[]> }> {
	const child = spawn(process.execPath, [serverPath]);
	let output = '';
	child.stdout?.on('data', (data) => { output += data.toString(); });
	const closed = once(child, 'close');
	const port = await new Promise<string>((resolve, reject) => {
		child.stdout?.once('data', (data) => resolve(data.toString().trim()));
		child.once('error', reject);
		child.once('close', () => reject(new Error('Test server exited before listening')));
	});
	return { child, port, output: () => output, closed };
}

async function expectKilled(makeArgs: (port: string) => string[], expectedSignal?: string) {
	const server = await startServer();
	try {
		const result = await runCli(makeArgs(server.port));
		assert.deepStrictEqual(result, { code: 0, signal: null, stdout: '', stderr: '' });
		const [code, signal] = await withTimeout(server.closed);
		if (platform() !== 'win32') {
			assert.equal(signal, expectedSignal ? null : 'SIGKILL');
			assert.equal(code, expectedSignal ? 0 : null);
			if (expectedSignal) {
				assert.ok(server.output().includes(expectedSignal));
			} else {
				assert.ok(!server.output().includes('SIGTERM'));
			}
		}
	} finally {
		if (server.child.exitCode === null && server.child.signalCode === null) {
			server.child.kill();
		}
	}
}

describe('CLI flag passing', () => {
	for (const [name, makeArgs] of [
		['positional', (port: string) => [port]],
		['-p', (port: string) => ['-p', port]],
		['--port', (port: string) => ['--port', port]],
		['-p=', (port: string) => [`-p=${port}`]],
		['--port=', (port: string) => [`--port=${port}`]],
	] as const) {
		it(`kills a process with ${name}`, async () => {
			await expectKilled(makeArgs);
		});
	}

	if (platform() !== 'win32') {
		for (const flag of ['--graceful', '--graceful=true']) {
			it(`sends SIGTERM with ${flag}`, async () => {
				await expectKilled((port) => [flag, '--port', port], 'SIGTERM');
			});
		}

		it('sends SIGKILL with --graceful=false', async () => {
			await expectKilled((port) => ['--graceful', '--port', port, '--graceful=false']);
		});
	}

	it('kills multiple ports with flags interspersed', async () => {
		const first = await startServer();
		const second = await startServer();
		try {
			const result = await runCli(['--silent', first.port, '--graceful', '-p', second.port]);
			assert.deepStrictEqual(result, { code: 0, signal: null, stdout: '', stderr: '' });
			await withTimeout(Promise.all([first.closed, second.closed]));
			if (platform() !== 'win32') {
				assert.ok(first.output().includes('SIGTERM'));
				assert.ok(second.output().includes('SIGTERM'));
			}
		} finally {
			for (const server of [first, second]) {
				if (server.child.exitCode === null && server.child.signalCode === null) {
					server.child.kill();
				}
			}
		}
	});

	for (const flag of ['--silent', '--silent=true']) {
		it(`suppresses errors with ${flag}`, async () => {
			assert.deepStrictEqual(await runCli(['--port', unusedPort, flag]), { code: 0, signal: null, stdout: '', stderr: '' });
		});
	}

	it('reports errors when --silent=false overrides --silent', async () => {
		assert.deepStrictEqual(await runCli(['--silent', '--silent=false', unusedPort]), { code: 1, signal: null, stdout: '', stderr: `No process found listening on port ${unusedPort}` });
	});

	it('reports errors with --silent false', async () => {
		assert.deepStrictEqual(await runCli(['--silent', 'false', '-p', unusedPort]), { code: 1, signal: null, stdout: '', stderr: `No process found listening on port ${unusedPort}` });
	});

	it('reports errors when --no-silent overrides --silent', async () => {
		assert.deepStrictEqual(await runCli(['--silent', '--no-silent', unusedPort]), { code: 1, signal: null, stdout: '', stderr: `No process found listening on port ${unusedPort}` });
	});

	it('kills every port of a JSON array', async () => {
		const first = await startServer();
		const second = await startServer();
		try {
			const result = await runCli(['-p', `[${first.port},${second.port}]`]);
			assert.deepStrictEqual(result, { code: 0, signal: null, stdout: '', stderr: '' });
			await withTimeout(Promise.all([first.closed, second.closed]));
		} finally {
			for (const server of [first, second]) {
				if (server.child.exitCode === null && server.child.signalCode === null) {
					server.child.kill();
				}
			}
		}
	});

	if (platform() !== 'win32') {
		it('sends SIGKILL with --no-graceful', async () => {
			await expectKilled((port) => ['--graceful', '--no-graceful', port]);
		});

		it('sends SIGTERM with --graceful true', async () => {
			await expectKilled((port) => ['--graceful', 'true', port], 'SIGTERM');
		});
	}

	for (const [args, error] of [
		[[], 'No port(s) found in provided args'],
		[['abc'], 'Invalid port(s): "abc". Ports must be integers between 1 and 65535'],
		[['--silent', '0'], 'Invalid port(s): "0". Ports must be integers between 1 and 65535'],
		[['-p', '[1234,'], 'Invalid port(s): "[1234,". Ports must be integers between 1 and 65535'],
		[['--no-silent=true', unusedPort], 'Unknown option: --no-silent=true'],
		[['-port', unusedPort], 'Unknown option: -port'],
		[['--port'], 'Missing port after --port'],
		[['--port', '--silent'], 'Missing port after --port'],
		[['-p'], 'Missing port after -p'],
		[['-p='], 'Missing port after -p'],
		[['--port='], 'Missing port after --port'],
		[['--unknown', unusedPort], 'Unknown option: --unknown'],
		[['--graceful=maybe', unusedPort], 'Unknown option: --graceful=maybe'],
		[['--silent=maybe', unusedPort], 'Unknown option: --silent=maybe'],
	] as const) {
		it(`reports invalid arguments: ${args.join(' ') || '(none)'}`, async () => {
			assert.deepStrictEqual(await runCli([...args]), { code: 1, signal: null, stdout: '', stderr: error });
		});
	}
});
