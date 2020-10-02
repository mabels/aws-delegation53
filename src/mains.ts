import { EC2MetadataCredentials, STS } from "aws-sdk";

import { Config, updateDNS } from './update-ns';
import { Route53Account } from "./aws-binding";


export function jsonLogger(h: Record<string, unknown>) {
  console.log(JSON.stringify(h));
}

export class EnvConfig implements Config {
  readonly accounts: Route53Account[];
  readonly credentials: STS.ClientConfiguration;
  readonly log = jsonLogger;
  constructor() {
    this.accounts = [process.env.ROLES || "", process.env.AWS_ROLE_ARN || ""]
      .join(",")
      .split(/[,\s]+/)
      .filter(i => i.length)
      .map((i) => ({
      roleArn: i,
    }));

    this.credentials = {}
  }
}

export async function awsMain() {
  return updateDNS(new EnvConfig())
}

export class ArgConfig extends EnvConfig {
  constructor(args: string[]) {
    super()
    this.accounts.push(...args.slice(2).map((i) => ({
      roleArn: i,
    })));
    // this.credentials = new EC2MetadataCredentials({
    //   // httpOptions: { timeout: 5000 }, // 5 second timeout
    //   // maxRetries: 10, // retry 10 times
    //   // retryDelayOptions: { base: 200 } // see AWS.Config for information
    // });
  }
  async start() {
    // await this.credentials.getPromise();
    return this;
  }
}


export function standaloneMain() {
  const config = new ArgConfig(process.argv);
  config.log({
    action: 'Accounts',
    env: ["ROLES","AWS_ROLE_ARN"],
    accounts: config.accounts.map(i => i.roleArn).join('.')
  })
  const updateInterval = (~~(process.env.UPDATEDNS_INTERVAL!) || 60) * 1000;
  config.log({
    action: 'UpdateInterval',
    env:["UPDATEDNS_INTERVAL"],
    updateInterval: updateInterval/1000,
    unit:'sec'
  });
  setInterval(() => {
    updateDNS(config)
  }, updateInterval)
  updateDNS(config)
}
