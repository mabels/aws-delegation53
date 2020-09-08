import cdk = require("@aws-cdk/core");
export interface DNSProps {
    readonly dnsAdmin: string;
    readonly domains: string[];
}
export declare class DNSStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props: cdk.StackProps & DNSProps);
}
