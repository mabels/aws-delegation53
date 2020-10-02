import { STS } from "aws-sdk";

import { Config, updateDNS } from './update-ns';
import { Route53Account } from "./aws-binding";

export class EnvConfig implements Config {
  readonly accounts: Route53Account[];
  readonly credentials: STS.ClientConfiguration;
  readonly log = console
  constructor() {
    this.accounts = [process.env.ROLES || "", process.env.AWS_ROLE_ARN || ""]
      .join(",")
      .split(/[,\s]+/)
      .filter(i => i.length)
      .map((i) => ({
      roleArn: i,
    }));
    this.log.info("Accounts:[ROLES,AWS_ROLE_ARN]", this.accounts.join('.'))
    this.credentials = {}
  }
}

export async function awsMain() {
  return updateDNS(new EnvConfig())
}

export function standaloneMain() {
  const config = new EnvConfig()
  const updateInterval = (~~(process.env.UPDATEDNS_INTERVAL!) || 60) * 1000;
  config.log.info("UpdateInterval:[UPDATEDNS_INTERVAL]", updateInterval/1000, 'sec');
  setInterval(() => {
    updateDNS(config)
  }, updateInterval)
  updateDNS(config)
}
