import {
  AccountsHostedZones,
  assumeRole,
  getHostedZones,
  AccountsHostedZone,
  updateRecord,
  Route53Account,
} from "./aws-binding";
import { Route53, STS, EC2MetadataCredentials } from "aws-sdk";
import {
  harmonizeName,
  buildZoneTree,
  walkTree,
  filterNS,
  deleteAddNS,
} from "./domain-tree";

async function getAccountsHostedZones(
  credentials: STS.ClientConfiguration,
  accounts: Route53Account[]
): Promise<AccountsHostedZones[]> {
  return Promise.all(
    accounts.map(async (account) => {
      const assume = await assumeRole(credentials, account.roleArn);
      const route53 = new Route53({
        secretAccessKey: assume.Credentials!.SecretAccessKey,
        accessKeyId: assume.Credentials!.AccessKeyId,
        sessionToken: assume.Credentials!.SessionToken,
      });
      return {
        account,
        route53,
        zones: await getHostedZones(route53),
      };
    })
  );
}

export interface Config {
  readonly accounts: Route53Account[];
  readonly credentials: STS.ClientConfiguration;
}

export class ArgConfig implements Config {
  readonly accounts: Route53Account[];
  readonly credentials: EC2MetadataCredentials;
  // readonly srcProfile: string
  // readonly dstRoleArn: string
  constructor(args: string[]) {
    this.accounts = args.slice(2).map((i) => ({
      roleArn: i,
    }));
    this.credentials = new EC2MetadataCredentials({
      // httpOptions: { timeout: 5000 }, // 5 second timeout
      // maxRetries: 10, // retry 10 times
      // retryDelayOptions: { base: 200 } // see AWS.Config for information
    });
  }
  async start() {
    await this.credentials.getPromise();
    return this
  }
}

export async function updateDNS(config: Config) {
  const time = new Date();
  console.log(`updateDNS:started ${time} with ${JSON.stringify(config.accounts)}`);



  const ret = await getAccountsHostedZones(config.credentials, config.accounts);
  // console.log(
  //   config.accounts,
  //   ret.map((i) => JSON.stringify(i.zones))
  // );

  const tree = buildZoneTree(ret);

  await walkTree(tree, async (tree, v) => {
    if (tree.ref && v.ref) {
      // console.log(tree.ref!.zone.hostZone.Id, tree.ref!.zone.recordSet)
      const topNSRecs = filterNS(tree.ref!.zone.recordSet, v.ref!.name);
      const downNSRecs = filterNS(v.ref!.zone.recordSet, v.ref!.name);
      const da = deleteAddNS(topNSRecs, downNSRecs);
      // console.log(topNSRecs, downNSRecs)
      if (da.add.length) {
        const first = da.add[0];
        const nsrec: Route53.ResourceRecordSet = {
          Name: first.Name,
          Type: first.Type,
          TTL: first.TTL,
          ResourceRecords: downNSRecs.map((i) => ({ Value: i.ResourceRecord })),
        };
        console.log(
          `Add:${tree.ref!.accountsHostedZones.account.roleArn}:`,
          nsrec
        );
        await updateRecord(
          tree.ref!.accountsHostedZones.route53,
          nsrec,
          tree.ref!.zone.hostZone.Id,
          v.ref!.accountsHostedZones.account.roleArn
        );
      }
    }
  });

}

// )(new ArgConfig(process.argv));
