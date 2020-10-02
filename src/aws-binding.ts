import * as AWS from 'aws-sdk';
import { Route53 } from 'aws-sdk';

export async function assumeRole(
  profile: AWS.STS.ClientConfiguration,
  assumeRole: string,
  session = `assumedRole_${assumeRole.replace(/[^A-Za-z0-9]/g, '_')}`,
): Promise<AWS.STS.AssumeRoleResponse> {
  return new Promise((rs, rj) => {
    let sts = new AWS.STS({
      apiVersion: '2011-06-15',
      ...profile,
    });
    sts.assumeRole(
      {
        RoleArn: assumeRole,
        RoleSessionName: 'router',
      },
      (err, data) => {
        if (err) {
          rj(err);
        } else {
          rs(data);
        }
      },
    );
  });
}

export async function getZoneRecords(route53: AWS.Route53, hostzone: AWS.Route53.HostedZone) {
  return new Promise<AWS.Route53.ResourceRecordSet[]>((rs, rj) => {
    const ret: AWS.Route53.ResourceRecordSet[] = [];
    function fetchAll(recordName: string) {
      const params = {
        HostedZoneId: hostzone.Id, // required
        // MaxItems: "16",
        // StartRecordIdentifier: '*',
        StartRecordName: recordName,
        StartRecordType: 'NS',
      };
      route53.listResourceRecordSets(params, (err, data) => {
        if (err) {
          rj(err);
          return;
        }
        ret.push(...data.ResourceRecordSets);
        if (data.NextRecordName) {
          fetchAll(data.NextRecordName);
        } else {
          rs(ret);
        }
      });
    }
    fetchAll(hostzone.Name);
  });
}

export async function updateRecord(
  route53: AWS.Route53,
  recordSet: Route53.ResourceRecordSet,
  zoneId: string,
  downRole: string,
  action = 'UPSERT',
): Promise<Route53.ChangeResourceRecordSetsResponse> {
  const params = {
    ChangeBatch: {
      Changes: [
        {
          Action: action,
          ResourceRecordSet: recordSet,
        },
      ],
      Comment: `Set the delegation for ${downRole}`,
    },
    HostedZoneId: zoneId,
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

export async function waitFor(
  route53: AWS.Route53,
  data: Route53.ChangeResourceRecordSetsResponse,
): Promise<Route53.GetChangeResponse> {
  const params = {
    Id: data.ChangeInfo.Id,
  };
  return new Promise((rs, rj) => {
    route53.waitFor('resourceRecordSetsChanged', params, (err, data) => {
      if (err) {
        rj(err);
      } else {
        rs(data);
      }
    });
  });
}

export interface HostedZoneInfo {
  hostZone: AWS.Route53.HostedZone;
  recordSet: Route53.ResourceRecordSet[];
}

export interface Route53Account {
  readonly roleArn: string;
}

export interface AccountsHostedZones {
  account: Route53Account;
  route53: AWS.Route53;
  zones: HostedZoneInfo[];
}

export interface AccountsHostedZone {
  name: string;
  accountsHostedZones: AccountsHostedZones;
  zone: HostedZoneInfo;
}

export async function getHostedZones(route53: AWS.Route53): Promise<HostedZoneInfo[]> {
  const result: HostedZoneInfo[] = [];
  return new Promise(async (rs, rj) => {
    function listHostedZones(req: Route53.ListHostedZonesRequest) {
      route53.listHostedZones(req, async (err, hostzones) => {
        if (err) {
          rj(err);
          return;
        }
        const infos = await Promise.all(
          hostzones.HostedZones.map(async (hz) => {
            return {
              hostZone: hz,
              recordSet: await getZoneRecords(route53, hz),
            };
          }),
        );
        result.push(...infos);
        if (hostzones.NextMarker && hostzones.IsTruncated) {
          listHostedZones({
            Marker: hostzones.NextMarker,
          });
        } else {
          rs(result);
        }
      });
    }
    listHostedZones({});
  });
}
