import { AccountsHostedZone, AccountsHostedZones } from "./aws-binding";
import { Route53 } from 'aws-sdk';

export function harmonizeName(name: string) {
  return name
    .toLocaleLowerCase()
    .trim()
    .replace(/\.+/g, ".")
    .replace(/\.$/, ""); // no trailing .
}

function revDomains(dname: string) {
  const out: string[] = [];
  let d: string[] = [];
  dname
    .split(".")
    .reverse()
    .forEach((part) => {
      d = [part, ...d];
      out.push(d.join("."));
    });
  return out;
}

export class Leaf<T = AccountsHostedZone> {
  parent?: Leaf<T>;
  children: Map<string, Leaf<T>> = new Map();
  ref?: T;
  public add(name: string, ref?: T) {
    let found = this.children.get(name);
    if (!found) {
      found = new Leaf();
      this.children.set(name, found);
    }
    found.parent = this;
    if (ref) {
      found.ref = ref;
    }
    return found;
  }
}

export function buildZoneTree(accounts: AccountsHostedZones[]) {
  const dnames = new Map<string, AccountsHostedZone[]>();
  accounts.forEach((ahzs) => {
    ahzs.zones.forEach((hzi) => {
      const dname = harmonizeName(hzi.hostZone.Name);
      // console.log(`dname=${dname}:${hzi.hostZone.Name}`)
      let found = dnames.get(dname);
      if (!found) {
        found = [];
        dnames.set(dname, found);
      }
      found.push({
        name: dname,
        accountsHostedZones: ahzs,
        zone: hzi,
      });
    });
  });
  const root = new Leaf();
  dnames.forEach((ahzs, dname) => {
    if (ahzs.length != 1) {
      console.error(
        `The ${dname} is skipped is owned by multiple accounts: ${JSON.stringify(
          ahzs.map((i) => i.accountsHostedZones.account.roleArn)
        )}`
      );
      return;
    }
    const ahz = ahzs[0];
    let parent = root;
    revDomains(dname).forEach((d) => {
      // console.log(`${dname} === ${d}`)
      parent = parent.add(d, dname === d ? ahz : undefined);
    });
  });
  return root;
}

interface ResourceRecord {
  Name: string;
  Type: string;
  TTL?: number;
  ResourceRecord: string;
}

export function filterNS(
  rrss: Route53.ResourceRecordSet[],
  name: string
): ResourceRecord[] {
  const ret: ResourceRecord[] = [];
  rrss
    .filter((i) => {
      return i.Type == "NS" && harmonizeName(i.Name) === harmonizeName(name);
    })
    .forEach((i) => {
      i.ResourceRecords?.forEach((rrec) => {
        ret.push({
          Name: i.Name,
          Type: i.Type,
          TTL: i.TTL,
          ResourceRecord: rrec.Value,
        });
      });
    });
  return ret.sort((a, b) => {
    if (a.ResourceRecord < b.ResourceRecord) {
      return -1;
    }
    if (a.ResourceRecord > b.ResourceRecord) {
      return 1;
    }
    return 0;
  });
}

export function deleteAddNS(n1: ResourceRecord[], n2: ResourceRecord[]) {
  const del: ResourceRecord[] = [];
  const add: ResourceRecord[] = [];
  n1.forEach((i, idx) => {
    if (!n2[idx] || i.Name !== n2[idx].Name) {
      del.push(i);
    }
  });
  n2.forEach((i, idx) => {
    if (!n1[idx] || i.Name !== n1[idx].Name) {
      add.push(i);
    }
  });
  return { del, add };
}

export async function walkTree(
  tree: Leaf,
  cb: (top: Leaf, down: Leaf) => Promise<unknown>
): Promise<unknown[]> {
  return Promise.all(
    Array.from(tree.children.values()).map(async (v) => {
      await cb(tree, v);
      return walkTree(v, cb);
    })
  );
}
