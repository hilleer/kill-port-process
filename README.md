# Kill-port-process

[![NPM](https://nodei.co/npm/kill-port-process.png?compact=true)](https://nodei.co/npm/kill-port-process/)

[![npm version](https://badge.fury.io/js/kill-port-process.svg)](https://badge.fury.io/js/kill-port-process)

**Cross-platform** module to stop a process running on a port.

## Usage

```javascript
const killPortProcess = require('kill-port-process');

module.export.main = async () => {
	try {
		await killPortProcess([4001, 4002]); // takes a number or a number[]
	} catch (error) {
		throw error;
	}
};
```

## Todo

* Add tests
* Clean up
