import { Route53Account } from "./aws-binding";
export interface Config {
    readonly accounts: Route53Account[];
}
export declare class ArgConfig implements Config {
    readonly accounts: Route53Account[];
    constructor(args: string[]);
}
