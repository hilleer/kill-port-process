const http = require('http');

const server = http.createServer();

const PORT = 2345;
server.listen(PORT, () => console.log(`Listening on ${PORT}`));