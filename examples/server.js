/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
const http = require('http');

const server = http.createServer();

const PORT = 1234;
server.listen(PORT, () => console.log(`Listening on ${PORT}`));
