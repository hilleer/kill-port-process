# Kill-port-process

**Cross-platform** module to stop a process running on a port.

## Usage

```javascript
const killPortProcesses = require('kill-port-process');

(async () => {
	try {
		await processKill([4001, 4002]);
	} catch (error) {
		throw error;
	}
})();
```