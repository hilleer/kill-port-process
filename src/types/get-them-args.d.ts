declare module 'get-them-args' {
	interface Args {
		p?: string | number | string[] | number[];
		port?: string | number | string[] | number[];
		unknown?: string | number | string[] | number[];
		graceful?: boolean;
		[key: string]: unknown;
	}
	function parse(argv?: string[]): Args;
	export = parse;
}
