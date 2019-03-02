#!/usr/bin/env node
const commander = require('commander');
const packageVersion = require('../package.json').version;

commander
	.version(packageVersion, '-v', '--version')
	.parse(process.argv);

