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

```javascript
const killPortProcess = require('kill-port-process');

const PORT = 1234; // long-running process running on this, e.g. a web-server.
await killPortProcess(PORT); // takes a number or a number[]

```

## Todo

* Add tests
* Add test build (travis)
* Add cli command
