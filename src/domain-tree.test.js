"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const domain_tree_1 = require("./domain-tree");
test("harmonizeName", () => {
    expect(domain_tree_1.harmonizeName("")).toBe("");
    expect(domain_tree_1.harmonizeName(".")).toBe("");
    expect(domain_tree_1.harmonizeName("bla")).toBe("bla");
    expect(domain_tree_1.harmonizeName(".bla.")).toBe("bla");
    expect(domain_tree_1.harmonizeName("bli.bla")).toBe("bli.bla");
    expect(domain_tree_1.harmonizeName("bli.bla.")).toBe("bli.bla");
    expect(domain_tree_1.harmonizeName("bli...bla...")).toBe("bli.bla");
    expect(domain_tree_1.harmonizeName("Bli...Bla...")).toBe("bli.bla");
    expect(domain_tree_1.harmonizeName("   Bli...Bla...\n")).toBe("bli.bla");
    expect(domain_tree_1.harmonizeName("   ....Bli...Bla...\n")).toBe("bli.bla");
});
test("revDomains", () => {
    expect(domain_tree_1.revDomains("")).toEqual([""]);
    expect(domain_tree_1.revDomains("bla")).toEqual(["bla"]);
    expect(domain_tree_1.revDomains("bli.bla")).toEqual(["bla", "bli.bla"]);
    expect(domain_tree_1.revDomains("blub.bli.bla")).toEqual([
        "bla",
        "bli.bla",
        "blub.bli.bla",
    ]);
});
test("Leaf", () => {
    var _a, _b, _c;
    const l = new domain_tree_1.Leaf();
    expect(l.children instanceof Map).toBeTruthy();
    expect(l.parent).toBeFalsy();
    expect(l.ref).toBeFalsy();
    l.add("bla", "XXX");
    expect(l.children.size).toBe(1);
    expect((_a = l.children.get("bla")) === null || _a === void 0 ? void 0 : _a.ref).toBe("XXX");
    l.add("bla", "YYY");
    expect(l.children.size).toBe(1);
    expect((_b = l.children.get("bla")) === null || _b === void 0 ? void 0 : _b.ref).toBe("YYY");
    l.add("bli", "YYY");
    expect(l.children.size).toBe(2);
    expect((_c = l.children.get("bli")) === null || _c === void 0 ? void 0 : _c.ref).toBe("YYY");
});
// export function buildZoneTree(accounts: AccountsHostedZones[]) {
//   const dnames = new Map<string, AccountsHostedZone[]>();
//   accounts.forEach((ahzs) => {
//     ahzs.zones.forEach((hzi) => {
//       const dname = harmonizeName(hzi.hostZone.Name);
//       // console.log(`dname=${dname}:${hzi.hostZone.Name}`)
//       let found = dnames.get(dname);
//       if (!found) {
//         found = [];
//         dnames.set(dname, found);
//       }
//       found.push({
//         name: dname,
//         accountsHostedZones: ahzs,
//         zone: hzi,
//       });
//     });
//   });
//   const root = new Leaf();
//   dnames.forEach((ahzs, dname) => {
//     if (ahzs.length != 1) {
//       console.error(
//         `The ${dname} is skipped is owned by multiple accounts: ${JSON.stringify(
//           ahzs.map((i) => i.accountsHostedZones.account.roleArn)
//         )}`
//       );
//       return;
//     }
//     const ahz = ahzs[0];
//     let parent = root;
//     revDomains(dname).forEach((d) => {
//       // console.log(`${dname} === ${d}`)
//       parent = parent.add(d, dname === d ? ahz : undefined);
//     });
//   });
//   return root;
// }
// interface ResourceRecord {
//   Name: string;
//   Type: string;
//   TTL?: number;
//   ResourceRecord: string;
// }
test("filterNS", () => {
    const my = domain_tree_1.filterNS([
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
    ], "bla");
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
    let da = domain_tree_1.deleteAddNS([], []);
    expect(da.add).toEqual([]);
    expect(da.del).toEqual([]);
    da = domain_tree_1.deleteAddNS([], [{ Name: "x", Type: "NS", ResourceRecord: "x" }]);
    expect(da.add).toEqual([{ Name: "x", Type: "NS", ResourceRecord: "x" }]);
    expect(da.del).toEqual([]);
    da = domain_tree_1.deleteAddNS([{ Name: "x", Type: "NS", ResourceRecord: "x" }], [{ Name: "x", Type: "NS", ResourceRecord: "x" }]);
    expect(da.add).toEqual([]);
    expect(da.del).toEqual([]);
    da = domain_tree_1.deleteAddNS([{ Name: "x", Type: "NS", ResourceRecord: "y" }], [{ Name: "x", Type: "NS", ResourceRecord: "x" }]);
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
function accountsHostedZones(name) {
    return {
        account: { roleArn: name },
        route53: {},
        zones: [{
                hostZone: {
                    Id: name,
                    Name: name,
                    CallerReference: name
                },
                recordSet: []
            }]
    };
}
test("buildZoneTree", async () => {
    const empty = domain_tree_1.buildZoneTree([]);
    expect(empty.children.size).toBe(0);
    // const top = tree.add("top", "top");
    // const topTop1 = top.add("top.top1", "top.top1");
    // const topTop2 = top.add("top.top2", "top.top2");
    // topTop1.add("top.top1.top1", "top.top1.top1");
    // topTop2.add("top.top2.top2", "top.top2.top2");
    // tree.add("top1", "top1").add("top1.top1", "top1.top1")
    const tree = domain_tree_1.buildZoneTree([
        accountsHostedZones("top.top1"),
        accountsHostedZones("top.top2"),
        accountsHostedZones("top.top1.top1"),
        accountsHostedZones("top.top2.top2"),
        accountsHostedZones("x.y.top2"),
        accountsHostedZones("top"),
        accountsHostedZones("top1.top1"),
        accountsHostedZones("top1")
    ]);
    const out = [];
    await domain_tree_1.walkTree(tree, async (_, d) => {
        out.push(d);
    });
    expect(out.map(i => { var _a; return (_a = i.ref) === null || _a === void 0 ? void 0 : _a.name; })).toEqual([
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
    ]);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tYWluLXRyZWUudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRvbWFpbi10cmVlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwrQ0FRdUI7QUFJdkIsSUFBSSxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7SUFDekIsTUFBTSxDQUFDLDJCQUFhLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDbkMsTUFBTSxDQUFDLDJCQUFhLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDcEMsTUFBTSxDQUFDLDJCQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDekMsTUFBTSxDQUFDLDJCQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0MsTUFBTSxDQUFDLDJCQUFhLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDakQsTUFBTSxDQUFDLDJCQUFhLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDbEQsTUFBTSxDQUFDLDJCQUFhLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDdEQsTUFBTSxDQUFDLDJCQUFhLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDdEQsTUFBTSxDQUFDLDJCQUFhLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUMzRCxNQUFNLENBQUMsMkJBQWEsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ2pFLENBQUMs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SUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQ25DLHNDQUFzQztJQUN0QyxtREFBbUQ7SUFDbkQsbURBQW1EO0lBQ25ELGlEQUFpRDtJQUNqRCxpREFBaUQ7SUFDakQseURBQXlEO0lBQ3pELE1BQU0sSUFBSSxHQUFHLDJCQUFhLENBQUM7UUFDekIsbUJBQW1CLENBQUMsVUFBVSxDQUFDO1FBQy9CLG1CQUFtQixDQUFDLFVBQVUsQ0FBQztRQUMvQixtQkFBbUIsQ0FBQyxlQUFlLENBQUM7UUFDcEMsbUJBQW1CLENBQUMsZUFBZSxDQUFDO1FBQ3BDLG1CQUFtQixDQUFDLFVBQVUsQ0FBQztRQUMvQixtQkFBbUIsQ0FBQyxLQUFLLENBQUM7UUFDMUIsbUJBQW1CLENBQUMsV0FBVyxDQUFDO1FBQ2hDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQztLQUM1QixDQUFDLENBQUE7SUFDRixNQUFNLEdBQUcsR0FBVyxFQUFFLENBQUE7SUFDdEIsTUFBTSxzQkFBUSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ2xDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDZCxDQUFDLENBQUMsQ0FBQztJQUNILE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQSxFQUFFLHdCQUFBLENBQUMsQ0FBQyxHQUFHLDBDQUFFLElBQUksR0FBQSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDbkMsTUFBTTtRQUNOLFNBQVM7UUFDVCxLQUFLO1FBQ0wsVUFBVTtRQUNWLFdBQVc7UUFDWCxVQUFVO1FBQ1YsU0FBUztRQUNULFNBQVM7UUFDVCxlQUFlO1FBQ2YsZUFBZTtRQUNmLFVBQVU7S0FDZCxDQUFDLENBQUE7QUFFSixDQUFDLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIGhhcm1vbml6ZU5hbWUsXG4gIHJldkRvbWFpbnMsXG4gIExlYWYsXG4gIGRlbGV0ZUFkZE5TLFxuICBmaWx0ZXJOUyxcbiAgd2Fsa1RyZWUsXG4gIGJ1aWxkWm9uZVRyZWUsXG59IGZyb20gXCIuL2RvbWFpbi10cmVlXCI7XG5pbXBvcnQgeyBBY2NvdW50c0hvc3RlZFpvbmUsIEFjY291bnRzSG9zdGVkWm9uZXMgfSBmcm9tIFwiLi9hd3MtYmluZGluZ1wiO1xuaW1wb3J0IHsgUm91dGU1MyB9IGZyb20gXCJhd3Mtc2RrXCI7XG5cbnRlc3QoXCJoYXJtb25pemVOYW1lXCIsICgpID0+IHtcbiAgZXhwZWN0KGhhcm1vbml6ZU5hbWUoXCJcIikpLnRvQmUoXCJcIik7XG4gIGV4cGVjdChoYXJtb25pemVOYW1lKFwiLlwiKSkudG9CZShcIlwiKTtcbiAgZXhwZWN0KGhhcm1vbml6ZU5hbWUoXCJibGFcIikpLnRvQmUoXCJibGFcIik7XG4gIGV4cGVjdChoYXJtb25pemVOYW1lKFwiLmJsYS5cIikpLnRvQmUoXCJibGFcIik7XG4gIGV4cGVjdChoYXJtb25pemVOYW1lKFwiYmxpLmJsYVwiKSkudG9CZShcImJsaS5ibGFcIik7XG4gIGV4cGVjdChoYXJtb25pemVOYW1lKFwiYmxpLmJsYS5cIikpLnRvQmUoXCJibGkuYmxhXCIpO1xuICBleHBlY3QoaGFybW9uaXplTmFtZShcImJsaS4uLmJsYS4uLlwiKSkudG9CZShcImJsaS5ibGFcIik7XG4gIGV4cGVjdChoYXJtb25pemVOYW1lKFwiQmxpLi4uQmxhLi4uXCIpKS50b0JlKFwiYmxpLmJsYVwiKTtcbiAgZXhwZWN0KGhhcm1vbml6ZU5hbWUoXCIgICBCbGkuLi5CbGEuLi5cXG5cIikpLnRvQmUoXCJibGkuYmxhXCIpO1xuICBleHBlY3QoaGFybW9uaXplTmFtZShcIiAgIC4uLi5CbGkuLi5CbGEuLi5cXG5cIikpLnRvQmUoXCJibGkuYmxhXCIpO1xufSk7XG5cbnRlc3QoXCJyZXZEb21haW5zXCIsICgpID0+IHtcbiAgZXhwZWN0KHJldkRvbWFpbnMoXCJcIikpLnRvRXF1YWwoW1wiXCJdKTtcbiAgZXhwZWN0KHJldkRvbWFpbnMoXCJibGFcIikpLnRvRXF1YWwoW1wiYmxhXCJdKTtcbiAgZXhwZWN0KHJldkRvbWFpbnMoXCJibGkuYmxhXCIpKS50b0VxdWFsKFtcImJsYVwiLCBcImJsaS5ibGFcIl0pO1xuICBleHBlY3QocmV2RG9tYWlucyhcImJsdWIuYmxpLmJsYVwiKSkudG9FcXVhbChbXG4gICAgXCJibGFcIixcbiAgICBcImJsaS5ibGFcIixcbiAgICBcImJsdWIuYmxpLmJsYVwiLFxuICBdKTtcbn0pO1xuXG50ZXN0KFwiTGVhZlwiLCAoKSA9PiB7XG4gIGNvbnN0IGwgPSBuZXcgTGVhZjxzdHJpbmc+KCk7XG4gIGV4cGVjdChsLmNoaWxkcmVuIGluc3RhbmNlb2YgTWFwKS50b0JlVHJ1dGh5KCk7XG4gIGV4cGVjdChsLnBhcmVudCkudG9CZUZhbHN5KCk7XG4gIGV4cGVjdChsLnJlZikudG9CZUZhbHN5KCk7XG4gIGwuYWRkKFwiYmxhXCIsIFwiWFhYXCIpO1xuICBleHBlY3QobC5jaGlsZHJlbi5zaXplKS50b0JlKDEpO1xuICBleHBlY3QobC5jaGlsZHJlbi5nZXQoXCJibGFcIik/LnJlZikudG9CZShcIlhYWFwiKTtcbiAgbC5hZGQoXCJibGFcIiwgXCJZWVlcIik7XG4gIGV4cGVjdChsLmNoaWxkcmVuLnNpemUpLnRvQmUoMSk7XG4gIGV4cGVjdChsLmNoaWxkcmVuLmdldChcImJsYVwiKT8ucmVmKS50b0JlKFwiWVlZXCIpO1xuICBsLmFkZChcImJsaVwiLCBcIllZWVwiKTtcbiAgZXhwZWN0KGwuY2hpbGRyZW4uc2l6ZSkudG9CZSgyKTtcbiAgZXhwZWN0KGwuY2hpbGRyZW4uZ2V0KFwiYmxpXCIpPy5yZWYpLnRvQmUoXCJZWVlcIik7XG59KTtcblxuLy8gZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkWm9uZVRyZWUoYWNjb3VudHM6IEFjY291bnRzSG9zdGVkWm9uZXNbXSkge1xuLy8gICBjb25zdCBkbmFtZXMgPSBuZXcgTWFwPHN0cmluZywgQWNjb3VudHNIb3N0ZWRab25lW10+KCk7XG4vLyAgIGFjY291bnRzLmZvckVhY2goKGFoenMpID0+IHtcbi8vICAgICBhaHpzLnpvbmVzLmZvckVhY2goKGh6aSkgPT4ge1xuLy8gICAgICAgY29uc3QgZG5hbWUgPSBoYXJtb25pemVOYW1lKGh6aS5ob3N0Wm9uZS5OYW1lKTtcbi8vICAgICAgIC8vIGNvbnNvbGUubG9nKGBkbmFtZT0ke2RuYW1lfToke2h6aS5ob3N0Wm9uZS5OYW1lfWApXG4vLyAgICAgICBsZXQgZm91bmQgPSBkbmFtZXMuZ2V0KGRuYW1lKTtcbi8vICAgICAgIGlmICghZm91bmQpIHtcbi8vICAgICAgICAgZm91bmQgPSBbXTtcbi8vICAgICAgICAgZG5hbWVzLnNldChkbmFtZSwgZm91bmQpO1xuLy8gICAgICAgfVxuLy8gICAgICAgZm91bmQucHVzaCh7XG4vLyAgICAgICAgIG5hbWU6IGRuYW1lLFxuLy8gICAgICAgICBhY2NvdW50c0hvc3RlZFpvbmVzOiBhaHpzLFxuLy8gICAgICAgICB6b25lOiBoemksXG4vLyAgICAgICB9KTtcbi8vICAgICB9KTtcbi8vICAgfSk7XG4vLyAgIGNvbnN0IHJvb3QgPSBuZXcgTGVhZigpO1xuLy8gICBkbmFtZXMuZm9yRWFjaCgoYWh6cywgZG5hbWUpID0+IHtcbi8vICAgICBpZiAoYWh6cy5sZW5ndGggIT0gMSkge1xuLy8gICAgICAgY29uc29sZS5lcnJvcihcbi8vICAgICAgICAgYFRoZSAke2RuYW1lfSBpcyBza2lwcGVkIGlzIG93bmVkIGJ5IG11bHRpcGxlIGFjY291bnRzOiAke0pTT04uc3RyaW5naWZ5KFxuLy8gICAgICAgICAgIGFoenMubWFwKChpKSA9PiBpLmFjY291bnRzSG9zdGVkWm9uZXMuYWNjb3VudC5yb2xlQXJuKVxuLy8gICAgICAgICApfWBcbi8vICAgICAgICk7XG4vLyAgICAgICByZXR1cm47XG4vLyAgICAgfVxuLy8gICAgIGNvbnN0IGFoeiA9IGFoenNbMF07XG4vLyAgICAgbGV0IHBhcmVudCA9IHJvb3Q7XG4vLyAgICAgcmV2RG9tYWlucyhkbmFtZSkuZm9yRWFjaCgoZCkgPT4ge1xuLy8gICAgICAgLy8gY29uc29sZS5sb2coYCR7ZG5hbWV9ID09PSAke2R9YClcbi8vICAgICAgIHBhcmVudCA9IHBhcmVudC5hZGQoZCwgZG5hbWUgPT09IGQgPyBhaHogOiB1bmRlZmluZWQpO1xuLy8gICAgIH0pO1xuLy8gICB9KTtcbi8vICAgcmV0dXJuIHJvb3Q7XG4vLyB9XG5cbi8vIGludGVyZmFjZSBSZXNvdXJjZVJlY29yZCB7XG4vLyAgIE5hbWU6IHN0cmluZztcbi8vICAgVHlwZTogc3RyaW5nO1xuLy8gICBUVEw/OiBudW1iZXI7XG4vLyAgIFJlc291cmNlUmVjb3JkOiBzdHJpbmc7XG4vLyB9XG5cbnRlc3QoXCJmaWx0ZXJOU1wiLCAoKSA9PiB7XG4gIGNvbnN0IG15ID0gZmlsdGVyTlMoXG4gICAgW1xuICAgICAge1xuICAgICAgICBOYW1lOiBcImJseFwiLFxuICAgICAgICBUeXBlOiBcIk5TXCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBOYW1lOiBcImJsYVwiLFxuICAgICAgICBUeXBlOiBcIk5TXCIsXG4gICAgICAgIFJlc291cmNlUmVjb3JkczogW3sgVmFsdWU6IFwienp6XCIgfSwgeyBWYWx1ZTogXCJ5eXlcIiB9XSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIE5hbWU6IFwiYmxhXCIsXG4gICAgICAgIFR5cGU6IFwiTlNcIixcbiAgICAgICAgUmVzb3VyY2VSZWNvcmRzOiBbeyBWYWx1ZTogXCJiYmJcIiB9LCB7IFZhbHVlOiBcImFhYVwiIH1dLFxuICAgICAgfSxcbiAgICBdLFxuICAgIFwiYmxhXCJcbiAgKTtcbiAgZXhwZWN0KG15KS50b0VxdWFsKFtcbiAgICB7XG4gICAgICBOYW1lOiBcImJsYVwiLFxuICAgICAgUmVzb3VyY2VSZWNvcmQ6IFwiYWFhXCIsXG4gICAgICBUVEw6IHVuZGVmaW5lZCxcbiAgICAgIFR5cGU6IFwiTlNcIixcbiAgICB9LFxuICAgIHtcbiAgICAgIE5hbWU6IFwiYmxhXCIsXG4gICAgICBSZXNvdXJjZVJlY29yZDogXCJiYmJcIixcbiAgICAgIFRUTDogdW5kZWZpbmVkLFxuICAgICAgVHlwZTogXCJOU1wiLFxuICAgIH0sXG4gICAge1xuICAgICAgTmFtZTogXCJibGFcIixcbiAgICAgIFJlc291cmNlUmVjb3JkOiBcInl5eVwiLFxuICAgICAgVFRMOiB1bmRlZmluZWQsXG4gICAgICBUeXBlOiBcIk5TXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICBOYW1lOiBcImJsYVwiLFxuICAgICAgUmVzb3VyY2VSZWNvcmQ6IFwienp6XCIsXG4gICAgICBUVEw6IHVuZGVmaW5lZCxcbiAgICAgIFR5cGU6IFwiTlNcIixcbiAgICB9LFxuICBdKTtcbn0pO1xuXG50ZXN0KFwiZGVsZXRlQWRkTlNcIiwgKCkgPT4ge1xuICBsZXQgZGEgPSBkZWxldGVBZGROUyhbXSwgW10pO1xuICBleHBlY3QoZGEuYWRkKS50b0VxdWFsKFtdKTtcbiAgZXhwZWN0KGRhLmRlbCkudG9FcXVhbChbXSk7XG4gIGRhID0gZGVsZXRlQWRkTlMoW10sIFt7IE5hbWU6IFwieFwiLCBUeXBlOiBcIk5TXCIsIFJlc291cmNlUmVjb3JkOiBcInhcIiB9XSk7XG4gIGV4cGVjdChkYS5hZGQpLnRvRXF1YWwoW3sgTmFtZTogXCJ4XCIsIFR5cGU6IFwiTlNcIiwgUmVzb3VyY2VSZWNvcmQ6IFwieFwiIH1dKTtcbiAgZXhwZWN0KGRhLmRlbCkudG9FcXVhbChbXSk7XG4gIGRhID0gZGVsZXRlQWRkTlMoXG4gICAgW3sgTmFtZTogXCJ4XCIsIFR5cGU6IFwiTlNcIiwgUmVzb3VyY2VSZWNvcmQ6IFwieFwiIH1dLFxuICAgIFt7IE5hbWU6IFwieFwiLCBUeXBlOiBcIk5TXCIsIFJlc291cmNlUmVjb3JkOiBcInhcIiB9XVxuICApO1xuICBleHBlY3QoZGEuYWRkKS50b0VxdWFsKFtdKTtcbiAgZXhwZWN0KGRhLmRlbCkudG9FcXVhbChbXSk7XG4gIGRhID0gZGVsZXRlQWRkTlMoXG4gICAgW3sgTmFtZTogXCJ4XCIsIFR5cGU6IFwiTlNcIiwgUmVzb3VyY2VSZWNvcmQ6IFwieVwiIH1dLFxuICAgIFt7IE5hbWU6IFwieFwiLCBUeXBlOiBcIk5TXCIsIFJlc291cmNlUmVjb3JkOiBcInhcIiB9XVxuICApO1xuICBleHBlY3QoZGEuYWRkKS50b0VxdWFsKFtcbiAgICB7XG4gICAgICBOYW1lOiBcInhcIixcbiAgICAgIFJlc291cmNlUmVjb3JkOiBcInhcIixcbiAgICAgIFR5cGU6IFwiTlNcIixcbiAgICB9LFxuICBdKTtcbiAgZXhwZWN0KGRhLmRlbCkudG9FcXVhbChbXG4gICAge1xuICAgICAgTmFtZTogXCJ4XCIsXG4gICAgICBSZXNvdXJjZVJlY29yZDogXCJ5XCIsXG4gICAgICBUeXBlOiBcIk5TXCIsXG4gICAgfSxcbiAgXSk7XG59KTtcblxuZnVuY3Rpb24gYWNjb3VudHNIb3N0ZWRab25lcyhuYW1lOiBzdHJpbmcpOiBBY2NvdW50c0hvc3RlZFpvbmVzIHtcbiAgcmV0dXJuIHtcbiAgICBhY2NvdW50OiB7IHJvbGVBcm46IG5hbWV9LFxuICAgIHJvdXRlNTM6IHt9IGFzIFJvdXRlNTMsXG4gICAgem9uZXM6IFt7XG4gICAgICBob3N0Wm9uZToge1xuICAgICAgICBJZDogbmFtZSxcbiAgICAgICAgTmFtZTogbmFtZSxcbiAgICAgICAgQ2FsbGVyUmVmZXJlbmNlOiBuYW1lXG4gICAgICB9LFxuICAgICAgcmVjb3JkU2V0OiBbXVxuICAgIH1dXG4gIH1cbn1cblxudGVzdChcImJ1aWxkWm9uZVRyZWVcIiwgYXN5bmMgKCkgPT4ge1xuICBjb25zdCBlbXB0eSA9IGJ1aWxkWm9uZVRyZWUoW10pXG4gIGV4cGVjdChlbXB0eS5jaGlsZHJlbi5zaXplKS50b0JlKDApXG4gIC8vIGNvbnN0IHRvcCA9IHRyZWUuYWRkKFwidG9wXCIsIFwidG9wXCIpO1xuICAvLyBjb25zdCB0b3BUb3AxID0gdG9wLmFkZChcInRvcC50b3AxXCIsIFwidG9wLnRvcDFcIik7XG4gIC8vIGNvbnN0IHRvcFRvcDIgPSB0b3AuYWRkKFwidG9wLnRvcDJcIiwgXCJ0b3AudG9wMlwiKTtcbiAgLy8gdG9wVG9wMS5hZGQoXCJ0b3AudG9wMS50b3AxXCIsIFwidG9wLnRvcDEudG9wMVwiKTtcbiAgLy8gdG9wVG9wMi5hZGQoXCJ0b3AudG9wMi50b3AyXCIsIFwidG9wLnRvcDIudG9wMlwiKTtcbiAgLy8gdHJlZS5hZGQoXCJ0b3AxXCIsIFwidG9wMVwiKS5hZGQoXCJ0b3AxLnRvcDFcIiwgXCJ0b3AxLnRvcDFcIilcbiAgY29uc3QgdHJlZSA9IGJ1aWxkWm9uZVRyZWUoW1xuICAgIGFjY291bnRzSG9zdGVkWm9uZXMoXCJ0b3AudG9wMVwiKSxcbiAgICBhY2NvdW50c0hvc3RlZFpvbmVzKFwidG9wLnRvcDJcIiksXG4gICAgYWNjb3VudHNIb3N0ZWRab25lcyhcInRvcC50b3AxLnRvcDFcIiksXG4gICAgYWNjb3VudHNIb3N0ZWRab25lcyhcInRvcC50b3AyLnRvcDJcIiksXG4gICAgYWNjb3VudHNIb3N0ZWRab25lcyhcIngueS50b3AyXCIpLFxuICAgIGFjY291bnRzSG9zdGVkWm9uZXMoXCJ0b3BcIiksXG4gICAgYWNjb3VudHNIb3N0ZWRab25lcyhcInRvcDEudG9wMVwiKSxcbiAgICBhY2NvdW50c0hvc3RlZFpvbmVzKFwidG9wMVwiKVxuICBdKVxuICBjb25zdCBvdXQ6IExlYWZbXSA9IFtdXG4gIGF3YWl0IHdhbGtUcmVlKHRyZWUsIGFzeW5jIChfLCBkKSA9PiB7XG4gICAgb3V0LnB1c2goZCk7XG4gIH0pO1xuICBleHBlY3Qob3V0Lm1hcChpPT5pLnJlZj8ubmFtZSkpLnRvRXF1YWwoW1xuICAgICAgIFwidG9wMVwiLFxuICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICBcInRvcFwiLFxuICAgICAgIFwidG9wLnRvcDFcIixcbiAgICAgICBcInRvcDEudG9wMVwiLFxuICAgICAgIFwidG9wLnRvcDJcIixcbiAgICAgICB1bmRlZmluZWQsXG4gICAgICAgdW5kZWZpbmVkLFxuICAgICAgIFwidG9wLnRvcDEudG9wMVwiLFxuICAgICAgIFwidG9wLnRvcDIudG9wMlwiLFxuICAgICAgIFwieC55LnRvcDJcIlxuICBdKVxuXG59KVxuIl19