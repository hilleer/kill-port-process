import { spawn } from 'child_process';
import { platform } from 'os';

export type Lookup = {
	command: string;
	args: string[];
	parse: (output: string) => number[];
	// a non-zero exit code meaning nothing matched, unless the command also reported an error on stderr
	noMatchCode?: number;
}

type RunResult = { code: number | null; signal: NodeJS.Signals | null; stdout: string; stderr: string };

// Only the start of stderr is kept for diagnostics, the rest is read and discarded
const MAX_STDERR_LENGTH = 1000;

export async function findListeningPids(port: number): Promise<number[]> {
	return runLookups(port, getLookups(port));
}

// Tries each lookup in turn until one finds a process. A lookup that is not installed or fails
// falls through to the next one; if none of them could run successfully, the collected failures are thrown.
export async function runLookups(port: number, lookups: Lookup[]): Promise<number[]> {
	const missing: string[] = [];
	const failures: string[] = [];
	let anyLookupSucceeded = false;

	for (const { command, args, parse, noMatchCode } of lookups) {
		let result: RunResult;
		try {
			result = await run(command, args);
		} catch (error) {
			const { code, message } = error as NodeJS.ErrnoException;
			if (code === 'ENOENT') {
				missing.push(command);
			} else {
				failures.push(`${command} could not be started: ${message}`);
			}
			continue;
		}

		const noMatch = result.code === noMatchCode && result.stderr.trim() === '';
		if (result.code !== 0 && !noMatch) {
			failures.push(describeFailure(command, result));
			continue;
		}

		anyLookupSucceeded = true;
		const pids = parse(result.stdout);
		if (pids.length > 0) {
			return pids;
		}
	}

	if (anyLookupSucceeded) {
		return [];
	}

	if (failures.length === 0) {
		throw new Error(`Unable to find processes on port ${port}: install ${missing.join(' or ')}`);
	}

	const reasons = [...failures, ...missing.map((command) => `${command} is not installed`)];
	throw new Error(`Unable to find processes on port ${port}: ${reasons.join('; ')}`);
}

function describeFailure(command: string, { code, signal, stderr }: RunResult): string {
	const status = code === null ? `was terminated by ${signal}` : `exited with code ${code}`;
	const details = stderr.trim().replace(/\s+/g, ' ');
	return details ? `${command} ${status}: ${details}` : `${command} ${status}`;
}

function getLookups(port: number): Lookup[] {
	switch (platform()) {
		case 'win32':
			return [netstatLookup(port)];
		case 'linux':
			// lsof may be missing or report nothing (e.g. in containers), so fall back to ss
			return [lsofLookup(port), ssLookup(port)];
		default:
			return [lsofLookup(port)];
	}
}

function netstatLookup(port: number): Lookup {
	return {
		command: 'netstat',
		args: ['-ano'],
		parse: (output) => parseNetstat(output, port),
	};
}

// Matches TCP listeners and UDP bindings on the port. Rows are identified by their remote address rather than
// the TCP state column, as the state is localized: TCP listeners have no remote peer (0.0.0.0:0 or [::]:0)
// and UDP rows have no state column and a *:* remote address.
export function parseNetstat(output: string, port: number): number[] {
	return toPids(output
		.split(/\r?\n/)
		.map((line) => line.trim().split(/\s+/))
		.filter(([protocol, local, remote]) => {
			if (getPort(local) !== port) {
				return false;
			}
			switch (protocol?.toUpperCase()) {
				case 'TCP':
					return /^(0\.0\.0\.0|\[::\]):0$/.test(remote);
				case 'UDP':
					return remote === '*:*';
				default:
					return false;
			}
		})
		.map((columns) => columns[columns.length - 1]));
}

function getPort(address: string | undefined): number | undefined {
	const match = address?.match(/:(\d+)$/);
	return match ? Number(match[1]) : undefined;
}

function lsofLookup(port: number): Lookup {
	return {
		command: 'lsof',
		args: ['-t', `-iTCP:${port}`, '-sTCP:LISTEN'],
		parse: (output) => toPids(output.split(/\s+/)),
		// lsof exits 1 both when nothing matches and on errors; -t implies -w, so anything on stderr is an error
		noMatchCode: 1,
	};
}

function ssLookup(port: number): Lookup {
	return {
		command: 'ss',
		args: ['-H', '-ltnp', `sport = :${port}`],
		parse: parseSs,
	};
}

// anchor on the trailing `,pid=N,fd=N)` of each users:(("name",pid=N,fd=N)) entry, so a process name containing `pid=` is not matched
export function parseSs(output: string): number[] {
	return toPids(Array.from(output.matchAll(/,pid=(\d+),fd=\d+\)/g), (match) => match[1]));
}

function toPids(values: string[]): number[] {
	const pids = values.filter((value) => /^\d+$/.test(value)).map(Number).filter((pid) => pid > 0);
	return Array.from(new Set(pids));
}

function run(command: string, args: string[]): Promise<RunResult> {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
		let stdout = '';
		let stderr = '';

		child.stdout.on('data', (data) => { stdout += data.toString(); });
		// stderr is always read so unread diagnostics cannot fill the pipe and block the command
		child.stderr.on('data', (data) => {
			if (stderr.length < MAX_STDERR_LENGTH) {
				stderr = (stderr + data.toString()).slice(0, MAX_STDERR_LENGTH);
			}
		});
		child.on('close', (code, signal) => resolve({ code, signal, stdout, stderr }));
		child.on('error', (err) => reject(err));
	});
}
