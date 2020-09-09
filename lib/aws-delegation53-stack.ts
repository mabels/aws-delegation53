import * as fs from 'fs';
import * as core from "@aws-cdk/core";
import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as iam from "@aws-cdk/aws-iam";
import * as events from '@aws-cdk/aws-events';
import * as targets from '@aws-cdk/aws-events-targets';
import { PolicyStatement } from '@aws-cdk/aws-iam';

export interface AWSDelegation53Props extends cdk.StackProps {
  readonly delegatorRole?: string // default delegation53
  readonly observedRoles: string[] // 
}

export class AWSDelegation53Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: AWSDelegation53Props) {
    super(scope, id, props);

    const delegator = new iam.Role(this, props?.delegatorRole || "delegation53", {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      roleName: props?.delegatorRole || "delegation53"
    })
    delegator.addManagedPolicy({
      managedPolicyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    })
    delegator.addToPolicy(new PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ["*"],
        actions: ["sts:AssumeRole"],
    }))

    const lambdaFn = new lambda.Function(this, "AWSDelegation53", {
      runtime: lambda.Runtime.NODEJS_12_X, // So we can use async in widget.js
      code: lambda.Code.asset("dist"),
      handler: "index.awsMain",
      timeout: cdk.Duration.seconds(5),
      environment: {
        ROLES: props.observedRoles.map(i => i.trim()).join(",")
      },
      role: delegator
    });

    const rule = new events.Rule(this, 'Rule', {
      schedule: events.Schedule.expression('rate(5 minutes)')
    });

    rule.addTarget(new targets.LambdaFunction(lambdaFn));
  }
}
