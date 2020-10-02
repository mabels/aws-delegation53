import {
  harmonizeName,
  revDomains,
  Leaf,
  deleteAddNS,
  filterNS,
  walkTree,
  buildZoneTree,
} from "./domain-tree";
import { AccountsHostedZone, AccountsHostedZones } from "./aws-binding";
import { Route53 } from "aws-sdk";

test("harmonizeName", () => {
  expect(harmonizeName("")).toBe("");
  expect(harmonizeName(".")).toBe("");
  expect(harmonizeName("bla")).toBe("bla");
  expect(harmonizeName(".bla.")).toBe("bla");
  expect(harmonizeName("bli.bla")).toBe("bli.bla");
  expect(harmonizeName("bli.bla.")).toBe("bli.bla");
  expect(harmonizeName("bli...bla...")).toBe("bli.bla");
  expect(harmonizeName("Bli...Bla...")).toBe("bli.bla");
  expect(harmonizeName("   Bli...Bla...\n")).toBe("bli.bla");
  expect(harmonizeName("   ....Bli...Bla...\n")).toBe("bli.bla");
});

test("revDomains", () => {
  expect(revDomains("")).toEqual([""]);
  expect(revDomains("bla")).toEqual(["bla"]);
  expect(revDomains("bli.bla")).toEqual(["bla", "bli.bla"]);
  expect(revDomains("blub.bli.bla")).toEqual([
    "bla",
    "bli.bla",
    "blub.bli.bla",
  ]);
});

test("Leaf", () => {
  const l = new Leaf<string>();
  expect(l.children instanceof Map).toBeTruthy();
  expect(l.parent).toBeFalsy();
  expect(l.ref).toBeFalsy();
  l.add("bla", "XXX");
  expect(l.children.size).toBe(1);
  expect(l.children.get("bla")?.ref).toBe("XXX");
  l.add("bla", "YYY");
  expect(l.children.size).toBe(1);
  expect(l.children.get("bla")?.ref).toBe("YYY");
  l.add("bli", "YYY");
  expect(l.children.size).toBe(2);
  expect(l.children.get("bli")?.ref).toBe("YYY");
});

test("filterNS", () => {
  const my = filterNS(
    [
      {
        Name: "blx",
        Type: "NS",
      },
      {
        Name: "bla",
        Type: "NS",
        ResourceRecords: [{ Value: "zzz" }, { Value: "yyy" }],
      },
      {
        Name: "bla",
        Type: "NS",
        ResourceRecords: [{ Value: "bbb" }, { Value: "aaa" }],
      },
    ],
    "bla"
  );
  expect(my).toEqual([
    {
      Name: "bla",
      ResourceRecord: "aaa",
      TTL: undefined,
      Type: "NS",
    },
    {
      Name: "bla",
      ResourceRecord: "bbb",
      TTL: undefined,
      Type: "NS",
    },
    {
      Name: "bla",
      ResourceRecord: "yyy",
      TTL: undefined,
      Type: "NS",
    },
    {
      Name: "bla",
      ResourceRecord: "zzz",
      TTL: undefined,
      Type: "NS",
    },
  ]);
});

test("deleteAddNS", () => {
  let da = deleteAddNS([], []);
  expect(da.add).toEqual([]);
  expect(da.del).toEqual([]);
  da = deleteAddNS([], [{ Name: "x", Type: "NS", ResourceRecord: "x" }]);
  expect(da.add).toEqual([{ Name: "x", Type: "NS", ResourceRecord: "x" }]);
  expect(da.del).toEqual([]);
  da = deleteAddNS(
    [{ Name: "x", Type: "NS", ResourceRecord: "x" }],
    [{ Name: "x", Type: "NS", ResourceRecord: "x" }]
  );
  expect(da.add).toEqual([]);
  expect(da.del).toEqual([]);
  da = deleteAddNS(
    [{ Name: "x", Type: "NS", ResourceRecord: "y" }],
    [{ Name: "x", Type: "NS", ResourceRecord: "x" }]
  );
  expect(da.add).toEqual([
    {
      Name: "x",
      ResourceRecord: "x",
      Type: "NS",
    },
  ]);
  expect(da.del).toEqual([
    {
      Name: "x",
      ResourceRecord: "y",
      Type: "NS",
    },
  ]);
});

function accountsHostedZones(name: string): AccountsHostedZones {
  return {
    account: { roleArn: name},
    route53: {} as Route53,
    zones: [{
      hostZone: {
        Id: name,
        Name: name,
        CallerReference: name
      },
      recordSet: []
    }]
  }
}

test("buildZoneTree", async () => {
  const empty = buildZoneTree(console, [])
  expect(empty.children.size).toBe(0)
  // const top = tree.add("top", "top");
  // const topTop1 = top.add("top.top1", "top.top1");
  // const topTop2 = top.add("top.top2", "top.top2");
  // topTop1.add("top.top1.top1", "top.top1.top1");
  // topTop2.add("top.top2.top2", "top.top2.top2");
  // tree.add("top1", "top1").add("top1.top1", "top1.top1")
  const tree = buildZoneTree(console, [
    accountsHostedZones("top.top1"),
    accountsHostedZones("top.top2"),
    accountsHostedZones("top.top1.top1"),
    accountsHostedZones("top.top2.top2"),
    accountsHostedZones("x.y.top2"),
    accountsHostedZones("top"),
    accountsHostedZones("top1.top1"),
    accountsHostedZones("top1")
  ])
  const out: Leaf[] = []
  await walkTree(tree, async (_, d) => {
    out.push(d);
  });
  expect(out.map(i=>i.ref?.name)).toEqual([
       "top1",
       undefined,
       "top",
       "top.top1",
       "top1.top1",
       "top.top2",
       undefined,
       undefined,
       "top.top1.top1",
       "top.top2.top2",
       "x.y.top2"
  ])

})
