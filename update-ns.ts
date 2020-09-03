import { AccountsHostedZones, assumeRole, getHostedZones, AccountsHostedZone, updateRecord, Route53Account } from './aws-binding';
import AWS, { Route53 } from 'aws-sdk';
import { harmonizeName, buildZoneTree, walkTree, filterNS, deleteAddNS } from './domain-tree';



  async function getAccountsHostedZones(
    credentials: AWS.STS.ClientConfiguration,
    accounts: Route53Account[]
  ): Promise<AccountsHostedZones[]> {
    return Promise.all(
      accounts.map(async (account) => {
        const assume = await assumeRole(credentials, account.roleArn);
        const route53 = new AWS.Route53({
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
}

export class ArgConfig implements Config {
  readonly accounts: Route53Account[];
  // readonly srcProfile: string
  // readonly dstRoleArn: string
  constructor(args: string[]) {
    this.accounts = args.slice(2).map((i) => ({
      roleArn: i,
    }));
  }
}

(async (config: Config) => {
  const credentials = new AWS.EC2MetadataCredentials({
    // httpOptions: { timeout: 5000 }, // 5 second timeout
    // maxRetries: 10, // retry 10 times
    // retryDelayOptions: { base: 200 } // see AWS.Config for information
  });
  await credentials.getPromise();

  const ret = await getAccountsHostedZones(credentials, config.accounts);
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

  // const ret1 = await getAccountsFromDNS(ret);

  // // const credentials = new AWS.SharedIniFileCredentials({
  // //   profile: config.srcProfile
  // // });
  // const srcCredentials = {
  //   secretAccessKey: credentials.secretAccessKey,
  //   accessKeyId: credentials.accessKeyId,
  //   sessionToken: credentials.sessionToken,
  // }
  // const srcRoute53 = new AWS.Route53(srcCredentials)
  // const srcDomains = await getHostedZones(srcRoute53);

  // const remoteCred = {
  //     ...credentials,
  //     secretAccessKey: credentials.secretAccessKey,
  //   }
  // const remoteRole = await assumeRole(remoteCred, config.dstRoleArn);
  // const remoteRoute53 = new AWS.Route53({
  //   secretAccessKey: remoteRole.Credentials!.SecretAccessKey,
  //   accessKeyId: remoteRole.Credentials!.AccessKeyId,
  //   sessionToken: remoteRole.Credentials!.SessionToken,
  // });

  // const remoteDomains = await getHostedZones(remoteRoute53);
  // console.log(srcDomains,  remoteDomains)
  /*

  const updateDomains: ZoneRecord[] = [];
  for (let topZone of topDomains.HostedZones) {
    for (let srcZone of srcDomains.HostedZones) {
      const hostZoneRecords = await getZoneRecord(srcRoute53, srcZone);
      const topZoneRecords = await getZoneRecord(
        topRoute53,
        topZone,
        srcZone.Name
      );
      for (let hostZoneRecord of hostZoneRecords) {
        for (let topZoneRecord of topZoneRecords.length
          ? topZoneRecords
          : [undefined]) {
          if (topZoneRecord) {
            let dontNeedUpdate =
              hostZoneRecord.Name == topZoneRecord.Name &&
              hostZoneRecord.Type == topZoneRecord.Type &&
              hostZoneRecord.ResourceRecords &&
              topZoneRecord.ResourceRecords &&
              hostZoneRecord.ResourceRecords.length ==
                topZoneRecord.ResourceRecords.length;
            if (
              dontNeedUpdate &&
              hostZoneRecord.ResourceRecords &&
              topZoneRecord.ResourceRecords
            ) {
              const x = hostZoneRecord.ResourceRecords.map(
                (i) => i.Value
              ).sort();
              const y = topZoneRecord.ResourceRecords.map(
                (i) => i.Value
              ).sort();
              dontNeedUpdate =
                x.filter((i, idx) => i === y[idx]).length == x.length;
            }
            if (dontNeedUpdate) {
              topZoneRecord = undefined;
            }
          } else {
            topZoneRecord = hostZoneRecord
          }
          updateDomains.push({
            hostZoneRecord: hostZoneRecord,
            topZoneRecord: topZoneRecord,
            zone: topZone,
          });
        }
      }
    }
  }
  for (let zone of updateDomains) {
    console.log(zone);
    if (zone.topZoneRecord) {
      const update = await updateRecord(topRoute53, {
        ...zone,
        topZoneRecord: zone.topZoneRecord
      }, 60)
      console.log(update);
      const wait = await waitFor(topRoute53, update)
      console.log(wait);
    }
  }
  */
})(new ArgConfig(process.argv));
