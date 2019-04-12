
declare function killPortProcess (input: any, options?: any): Promise<void>;

declare namespace killPortProcess {
	export type Options = {};
 	export function killPortProcess(input: number | number[], options?: Options): Promise<void>;
}

export = killPortProcess;
