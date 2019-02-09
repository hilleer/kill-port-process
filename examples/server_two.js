const http = require('http');

const server = http.createServer();

server.listen(2345, () => console.log('Listening...'));