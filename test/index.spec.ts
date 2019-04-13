import { createServer } from 'http';
import killPortProcess from '../src/lib';

describe('index', () => {
	describe('when called on a port', () => {
		const PORT = 1234;

		before((done) => {
			createServer((req, res) => res.end())
				.listen(PORT, () => done());
		});
		it('should kill port', async () => {
			try {
				await killPortProcess(PORT)
			} catch (error) {
				console.log('error', error);
				console.log('err, err!');
			}
		});
	});
});