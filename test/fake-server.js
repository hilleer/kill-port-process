const http = require('http');

const server = http.createServer((req, res) => {
	res.statusCode = 200;
	res.end();
});

const PORT = 1234;

server.listen(PORT, () => process.stdout.write(`Listening on ${PORT}`));
