/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
const http = require('http');

const server = http.createServer((_request, response) => response.end());

process.on('SIGTERM', () => {
	process.stdout.write('SIGTERM\n', () => server.close(() => process.exit(0)));
});

server.listen(0, '0.0.0.0', () => {
	process.stdout.write(`${server.address().port}\n`);
});
