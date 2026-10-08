# Kill-port-process

[![npm version](https://badge.fury.io/js/kill-port-process.svg)](https://badge.fury.io/js/kill-port-process)
[![Test](https://github.com/hilleer/kill-port-process/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/hilleer/kill-port-process/actions/workflows/ci.yml)
[![CodeQL](https://github.com/hilleer/kill-port-process/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/hilleer/kill-port-process/actions/workflows/github-code-scanning/codeql)

**Cross-platform** module to stop one (or more) process(es) running on a port (or a list of ports) with **zero dependencies**.

On macOS and Linux, processes listening on a TCP port are found using `lsof`. On Linux, `ss` is used as a fallback when `lsof` is not installed, fails or finds nothing. On Windows, processes are found using `netstat` and both TCP listeners and UDP bindings on the port are matched. If a lookup command is installed but fails (e.g. due to missing permissions), its error is reported rather than "No process found".

## Install

Requires Node.js 22 or later.

```bash
$ npm install kill-port-process
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
* `silent` (optional): suppresses the output of the command regardless of the result. takes a boolean, default is `false`.

Ports must be integers (or strings of digits) between 1 and 65535. All ports are validated before any process is killed, and an invalid port is reported even when `silent` is `true`.

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
# or a JSON array of ports
$ kill-port -p '[1234,2345]'
```

`-p` and `--port` can be repeated and combined with positional ports.

#### Flags

* `--graceful` kill the process gracefully.
  * **Unix:** Sends a `-15` signal to kill (`SIGTERM`) rather than `-9` (`SIGKILL`)
  * **Win:** Currently no use
* `--silent` suppresses the output of the command regardless of the result. takes a boolean, default is `false`.

Both flags accept an optional boolean value, `--silent=false` or `--silent false`, and can be negated, `--no-silent`. Any other value following a flag is treated as a port, so `kill-port --graceful 1234` kills port `1234` gracefully.

---

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/hilleer)
