import { AccountsHostedZone, AccountsHostedZones } from "./aws-binding";
import { Route53 } from 'aws-sdk';
export declare function harmonizeName(name: string): string;
export declare function revDomains(dname: string): string[];
export declare class Leaf<T = AccountsHostedZone> {
    parent?: Leaf<T>;
    children: Map<string, Leaf<T>>;
    ref?: T;
    add(name: string, ref?: T): Leaf<T>;
}
export declare function buildZoneTree(accounts: AccountsHostedZones[]): Leaf<AccountsHostedZone>;
interface ResourceRecord {
    Name: string;
    Type: string;
    TTL?: number;
    ResourceRecord: string;
}
export declare function filterNS(rrss: Route53.ResourceRecordSet[], name: string): ResourceRecord[];
export declare function deleteAddNS(n1: ResourceRecord[], n2: ResourceRecord[]): {
    del: ResourceRecord[];
    add: ResourceRecord[];
};
export declare function walkTree<T>(tree: Leaf<T>, cb: (top: Leaf<T>, down: Leaf<T>) => Promise<unknown>): Promise<unknown[]>;
export {};
