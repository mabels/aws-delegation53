import {
  AccountsHostedZones,
  assumeRole,
  getHostedZones,
  AccountsHostedZone,
  updateRecord,
  Route53Account,
} from './aws-binding';
import { Route53, STS, EC2MetadataCredentials } from 'aws-sdk';
import { buildZoneTree, walkTree, filterNS, deleteAddNS } from './domain-tree';

export type LogFN = (h: Record<string, unknown>) => void;

async function getAccountsHostedZones(
  credentials: STS.ClientConfiguration,
  accounts: Route53Account[],
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
    }),
  );
}

export interface Config {
  readonly accounts: Route53Account[];
  readonly credentials: STS.ClientConfiguration;
  readonly log: LogFN;
}


export async function updateDNS(config: Config) {
  const time = new Date();
  config.log({
    action: 'updateDNS',
    time: time,
    actions: config.accounts,
  });
  const ret = await getAccountsHostedZones(config.credentials, config.accounts);
  const tree = buildZoneTree(config.log, ret);

  await walkTree(tree, async (tree, v) => {
    if (tree.ref && v.ref) {
      const topNSRecs = filterNS(tree.ref!.zone.recordSet, v.ref!.name);
      const downNSRecs = filterNS(v.ref!.zone.recordSet, v.ref!.name);
      const da = deleteAddNS(topNSRecs, downNSRecs);
      if (da.add.length) {
        const first = da.add[0];
        const nsrec: Route53.ResourceRecordSet = {
          Name: first.Name,
          Type: first.Type,
          TTL: first.TTL,
          ResourceRecords: downNSRecs.map((i) => ({ Value: i.ResourceRecord })),
        };
        config.log(
          // `Add:${tree.ref!.accountsHostedZones.account.roleArn}:${tree.ref!.name}:`,
          {
            action: 'ADD',
            role: tree.ref!.accountsHostedZones.account.roleArn,
            to: tree.ref!.name,
            record: nsrec,
          }
        );
        await updateRecord(
          tree.ref!.accountsHostedZones.route53,
          nsrec,
          tree.ref!.zone.hostZone.Id,
          v.ref!.accountsHostedZones.account.roleArn,
        );
      }
    }
  });
}

// )(new ArgConfig(process.argv));
