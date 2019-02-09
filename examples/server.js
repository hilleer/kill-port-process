const http = require('http');

const server = http.createServer();

server.listen(1234, () => console.log('Listening...'));