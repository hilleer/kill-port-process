# Kill-port-process

[![NPM](https://nodei.co/npm/kill-port-process.png?compact=true)](https://nodei.co/npm/kill-port-process/)

[![npm version](https://badge.fury.io/js/kill-port-process.svg)](https://badge.fury.io/js/kill-port-process)

**Cross-platform** module to stop one (or more) process(es) running on a port (or a list of ports).

## Install

```bash
$ npm install kill-port-process -E
# or
$ yarn add kill-port-process
```

## Usage

### Programmatic

```javascript
const killPortProcess = require('kill-port-process');

const PORT = 1234; // long-running process running on this, e.g. a web-server.
await killPortProcess(PORT); // takes a number or a number[]
```

### CLI

Install the module globally: `npm install kill-port-process -g`.

You can use the CLI calling it with `kill-port <port>`.

It takes a single port or a list of ports separated by a space. Valid flags are `-p` and `--port` but are both optional.

```bash
$ kill-port 1234
# or multiple ports
$ kill-port 1234 2345
# or
$ kill-port -p 1234
# or
$ kill-port --port 1234
```
