
declare function killPortProcess (input: any, options?: any): Promise<void>;

type Input = number | number [] | string | string [];

declare namespace killPortProcess {
	export type Options = {};
 	export function killPortProcess(input: Input, options?: Options): Promise<void>;
}

export = killPortProcess;
