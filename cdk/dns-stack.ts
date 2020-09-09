import cdk = require("@aws-cdk/core");
import route53 = require("@aws-cdk/aws-route53");
import iam = require("@aws-cdk/aws-iam");
import { PolicyStatement } from "@aws-cdk/aws-iam";

export interface DNSProps {
  readonly dnsAdmin: string;
  readonly delegation53Arn: string;
  readonly domains: string[];
}


function dnsStack( stack: cdk.Stack, props: DNSProps) {
  const zones = props.domains.map((d) =>
      new route53.PublicHostedZone(stack, d, {
        zoneName: d,
      })
  );
  const dnsAdmin = new iam.Role(stack, props.dnsAdmin, {
	  assumedBy: new iam.ArnPrincipal(props.delegation53Arn),
	  roleName: props.dnsAdmin
  })
  dnsAdmin.addToPolicy(
    new PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["route53:ChangeResourceRecordSets"],
      resources: ["arn:aws:route53:::hostedzone/*"],
    })
  );
  dnsAdmin.addToPolicy(
    new PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["route53:ListHostedZones", "route53:ListResourceRecordSets"],
      resources: ["*"],
    })
  );
  return zones;
}


export class DNSStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: cdk.StackProps & DNSProps) {
    super(scope, id, props);
    dnsStack(this, props)
  }
}
