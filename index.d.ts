declare function killPortProcess (input: any, opts?: any): Promise<void>;

declare namespace killPortProcess {
 	export function killPortProcess(input: number | number[], opts?: any): Promise<void>;
}

export = killPortProcess;
