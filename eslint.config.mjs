import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
	{ ignores: ['dist', 'node_modules'] },
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		languageOptions: {
			globals: {
				console: 'readonly',
				process: 'readonly',
				exports: 'writable',
				require: 'readonly',
				module: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',
			},
		},
		rules: {
			'@typescript-eslint/no-var-requires': 'warn',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
		},
	},
	{
		files: ['test/**/*.ts'],
		rules: {
			'@typescript-eslint/no-unused-expressions': 'off',
		},
	},
];
