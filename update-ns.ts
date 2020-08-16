import * as AWS from "aws-sdk";
import { Route53 } from "aws-sdk";

async function assumeRole(
  profile: AWS.STS.ClientConfiguration,
  assumeRole: string,
  session = `assumedRole_${assumeRole.replace(/[^A-Za-z0-9]/g, '_')}`
): Promise<AWS.STS.AssumeRoleResponse> {
  return new Promise((rs, rj) => {
    let sts = new AWS.STS({
      apiVersion: "2011-06-15",
      ...profile,
    });
    sts.assumeRole(
      {
        RoleArn: assumeRole,
        RoleSessionName: "router",
      },
      (err, data) => {
        if (err) {
          rj(err);
        } else {
          rs(data);
        }
      }
    );
  });
}

export interface ZoneRecord {
  readonly hostZoneRecord: AWS.Route53.ResourceRecordSet;
  readonly topZoneRecord?: AWS.Route53.ResourceRecordSet;
  readonly zone: AWS.Route53.HostedZone;
}

export interface UpdateZoneRecord extends ZoneRecord {
  readonly topZoneRecord: AWS.Route53.ResourceRecordSet;
}

async function getHostedZones(
  route53: AWS.Route53
): Promise<AWS.Route53.ListHostedZonesResponse> {
  return new Promise(async (rs, rj) => {
    route53.listHostedZones({}, async (err, hostzones) => {
      if (err) {
        rj(err);
        return;
      }
      rs(hostzones);
    });
  });
}

async function getZoneRecord(
  route53: AWS.Route53,
  hostzone: AWS.Route53.HostedZone,
  recordName = hostzone.Name
) {
  return new Promise<AWS.Route53.ResourceRecordSet[]>((rs, rj) => {
    const params = {
      HostedZoneId: hostzone.Id, // required
      MaxItems: "16",
      // StartRecordIdentifier: '*',
      StartRecordName: recordName,
      StartRecordType: "NS",
    };
    route53.listResourceRecordSets(params, (err, data) => {
      if (err) {
        rj(err);
        return;
      }
      const nss = data.ResourceRecordSets.filter(
        (rrs) => rrs.Type === "NS" && rrs.Name === recordName
      );
      rs(nss);
    });
  });
}

async function updateRecord(route53: AWS.Route53, zone: UpdateZoneRecord, ttl = 60, action = 'UPSERT'): Promise<Route53.ChangeResourceRecordSetsResponse> {
  const params = {
    ChangeBatch: {
      Changes: [
        {
          Action: action,
          ResourceRecordSet: {
            Name: zone.topZoneRecord!.Name,
            ResourceRecords: zone.hostZoneRecord.ResourceRecords,
            TTL: ttl,
            Type: zone.hostZoneRecord.Type,
          },
        },
      ],
      Comment: `Set the delegation for ${zone.topZoneRecord!.Name}`,
    },
    HostedZoneId: zone.zone.Id,
  };
  return new Promise((rs, rj) => {
    route53.changeResourceRecordSets(params, function (err, data) {
      if (err) {
        rj(err);
      } else {
        rs(data);
      }
    });
  });
}

async function waitFor(
  route53: AWS.Route53,
  data: Route53.ChangeResourceRecordSetsResponse
): Promise<Route53.GetChangeResponse> {
  const params = {
    Id: data.ChangeInfo.Id,
  };
  return new Promise((rs, rj) => {
    route53.waitFor("resourceRecordSetsChanged", params, (err, data) => {
      if (err) {
        rj(err);
      } else {
        rs(data);
      }
    });
  });
}

export interface Config {
  readonly srcProfile: string
  readonly dstProfile: string
}

export class ArgConfig implements Config {
  readonly srcProfile: string
  readonly dstProfile: string
  constructor(args: string[]) {
    this.srcProfile = args[args.length - 2]
    this.dstProfile = args[args.length - 1]
  }
}

(async (config: Config) => {
  const credentials = new AWS.SharedIniFileCredentials({
    profile: config.srcProfile
  });
  const srcRoute53 = new AWS.Route53({
    secretAccessKey: credentials.secretAccessKey,
    accessKeyId: credentials.accessKeyId,
    sessionToken: credentials.sessionToken,
  });
  const srcDomains = await getHostedZones(srcRoute53);

  const topRole = await assumeRole(
    {
      ...credentials,
      secretAccessKey: credentials.secretAccessKey,
    },
    config.dstProfile
  );

  const topRoute53 = new AWS.Route53({
    secretAccessKey: topRole.Credentials!.SecretAccessKey,
    accessKeyId: topRole.Credentials!.AccessKeyId,
    sessionToken: topRole.Credentials!.SessionToken,
  });

  const topDomains = await getHostedZones(topRoute53);

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
})(new ArgConfig(process.argv));
