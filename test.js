const processKill = require('./index');


(async () => {
	try {
		await processKill([4001, 4002]);
	} catch (error) {
		throw error;
	}
})();