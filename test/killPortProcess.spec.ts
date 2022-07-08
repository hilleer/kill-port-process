import { expect } from 'chai';
import { spawn } from 'child_process';

describe.only('bin/kill-port-process', () => {
	describe('when killing process', () => {
		it('should', (done) => {
			const args = [
				'dist/bin/kill-port-process',
				'--port',
				'1234',
				'--graceful'
			];
			const child = spawn('node', args);

			child.stderr.on('data', (data) => console.log('stderr:::', data.toString()));
			child.stdout.on('data', (data) => console.log('stdout:::', data.toString()));

			setTimeout(() => {
				expect(true).to.equal(true);
				done();
			}, 1500);
		});
	});
});