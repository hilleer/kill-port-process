const http = require('http');

const PORT = 9999;

before('> Setting up test server', (done) => {
	const server = http.createServer((req, res) => {
		res.statusCode = 200;
		res.end();
	});
	server.listen(PORT, () => {
		console.log('> Test server started');
		done();
	});
});