# Kill-port-process

[![npm version](https://badge.fury.io/js/kill-port-process.svg)](https://badge.fury.io/js/kill-port-process)
[![Node.js CI](https://github.com/hilleer/kill-port-process/actions/workflows/node.js.yml/badge.svg?branch=main)](https://github.com/hilleer/kill-port-process/actions/workflows/node.js.yml)
[![CodeQL](https://github.com/hilleer/kill-port-process/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/hilleer/kill-port-process/actions/workflows/codeql-analysis.yml)

**Cross-platform** module to stop one (or more) process(es) running on a port (or a list of ports).

## Install

```bash
$ npm install kill-port-process
# or
$ yarn add kill-port-process
```

## Usage

### Programmatically

```javascript
const { killPortProcess } = require('kill-port-process');

(async () => {
  // long running process running on a given port(s), e.g. a http-server
  // takes a number, number[], string or string[]
  // single port
  await killPortProcess(1234);

  // multiple ports
  await killPortProcess([1234, 6789]);

  // with options
  await killPortProcess(1234, { signal: 'SIGTERM' });
})();
```

#### Options

* `signal` (optional): used to determine the command used to kill the provided port(s). Valid values are:
  * `SIGKILL` (default)
  * `SIGTERM`

### CLI

Install the module globally:

```bash
npm install kill-port-process -g
```

You can use the CLI calling it with `kill-port <port>`.

It takes a single port or a list of ports separated by a space. Valid flags are `-p` and `--port` but are both optional.

```bash
$ kill-port 1234
# or multiple ports, separated by space(s)
$ kill-port 1234 2345
# or
$ kill-port -p 1234
# or
$ kill-port --port 1234
```

#### Flags

* `--graceful` kill the process gracefully.
  * **Unix:** Sends a `-15` signal to kill (`SIGTERM`) rather than `-9` (`SIGKILL`)
  * **Win:** Currently no use
