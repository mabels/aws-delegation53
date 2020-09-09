import { STS } from "aws-sdk";

import { Config, updateDNS } from './update-ns';
import { Route53Account } from "./aws-binding";

export class EnvConfig implements Config {
  readonly accounts: Route53Account[];
  readonly credentials: STS.ClientConfiguration;
  constructor() {
    this.accounts = (process.env.ROLES || "").split(/[,\s]+/).filter(i => i.length).map((i) => ({
      roleArn: i,
    }));
    this.credentials = {}
  }
}

export async function awsMain() {
  return updateDNS(new EnvConfig())
}
