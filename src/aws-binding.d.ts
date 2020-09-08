import * as AWS from "aws-sdk";
import { Route53 } from "aws-sdk";
export declare function assumeRole(profile: AWS.STS.ClientConfiguration, assumeRole: string, session?: string): Promise<AWS.STS.AssumeRoleResponse>;
export declare function getZoneRecords(route53: AWS.Route53, hostzone: AWS.Route53.HostedZone): Promise<Route53.ResourceRecordSet[]>;
export declare function updateRecord(route53: AWS.Route53, recordSet: Route53.ResourceRecordSet, zoneId: string, downRole: string, action?: string): Promise<Route53.ChangeResourceRecordSetsResponse>;
export declare function waitFor(route53: AWS.Route53, data: Route53.ChangeResourceRecordSetsResponse): Promise<Route53.GetChangeResponse>;
export interface HostedZoneInfo {
    hostZone: AWS.Route53.HostedZone;
    recordSet: Route53.ResourceRecordSet[];
}
export interface Route53Account {
    readonly roleArn: string;
}
export interface AccountsHostedZones {
    account: Route53Account;
    route53: AWS.Route53;
    zones: HostedZoneInfo[];
}
export interface AccountsHostedZone {
    name: string;
    accountsHostedZones: AccountsHostedZones;
    zone: HostedZoneInfo;
}
export declare function getHostedZones(route53: AWS.Route53): Promise<HostedZoneInfo[]>;
