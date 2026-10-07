import { spawn } from 'child_process';
import { platform } from 'os';

type Lookup = {
	command: string;
	args: string[];
	parse: (output: string) => number[];
}

export async function findListeningPids(port: number): Promise<number[]> {
	const lookups = getLookups(port);

	let anyLookupRan = false;
	for (const { command, args, parse } of lookups) {
		try {
			const pids = parse(await run(command, args));
			anyLookupRan = true;

			if (pids.length > 0) {
				return pids;
			}
		} catch {
			// command not available, try the next one
		}
	}

	if (!anyLookupRan) {
		const commands = lookups.map(({ command }) => command).join(' or ');
		throw new Error(`Unable to find processes on port ${port}: install ${commands}`);
	}

	return [];
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
		parse: (output) => toPids(output
			.split(/\r?\n/)
			.map((line) => line.trim().split(/\s+/))
			// match on the remote address rather than the state column, as the state is localized
			.filter(([, local, remote]) => local?.endsWith(`:${port}`) && /^(0\.0\.0\.0|\[::\]):0$/.test(remote))
			.map((columns) => columns[columns.length - 1])),
	};
}

function lsofLookup(port: number): Lookup {
	return {
		command: 'lsof',
		args: ['-t', `-iTCP:${port}`, '-sTCP:LISTEN'],
		parse: (output) => toPids(output.split(/\s+/)),
	};
}

function ssLookup(port: number): Lookup {
	return {
		command: 'ss',
		args: ['-H', '-ltnp', `sport = :${port}`],
		parse: (output) => toPids(Array.from(output.matchAll(/pid=(\d+)/g), (match) => match[1])),
	};
}

function toPids(values: string[]): number[] {
	const pids = values.filter(Boolean).map(Number).filter((pid) => pid > 0);
	return Array.from(new Set(pids));
}

// Resolves with stdout regardless of exit code (lsof exits 1 when nothing matches)
function run(command: string, args: string[]): Promise<string> {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args);
		let stdout = '';

		child.stdout.on('data', (data) => { stdout += data.toString(); });
		child.on('close', () => resolve(stdout));
		child.on('error', (err) => reject(err));
	});
}
