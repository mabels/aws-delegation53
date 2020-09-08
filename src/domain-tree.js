"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walkTree = exports.deleteAddNS = exports.filterNS = exports.buildZoneTree = exports.Leaf = exports.revDomains = exports.harmonizeName = void 0;
function harmonizeName(name) {
    return name
        .toLocaleLowerCase()
        .trim()
        .replace(/\.+/g, ".")
        .replace(/^\./, "") // no leading .
        .replace(/\.$/, ""); // no trailing .
}
exports.harmonizeName = harmonizeName;
function revDomains(dname) {
    const out = [];
    let d = [];
    dname
        .split(".")
        .reverse()
        .forEach((part) => {
        d = [part, ...d];
        out.push(d.join("."));
    });
    return out;
}
exports.revDomains = revDomains;
class Leaf {
    constructor() {
        this.children = new Map();
    }
    add(name, ref) {
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
exports.Leaf = Leaf;
function buildZoneTree(accounts) {
    const dnames = new Map();
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
            console.error(`The ${dname} is skipped is owned by multiple accounts: ${JSON.stringify(ahzs.map((i) => i.accountsHostedZones.account.roleArn))}`);
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
exports.buildZoneTree = buildZoneTree;
function filterNS(rrss, name) {
    const ret = [];
    rrss
        .filter((i) => {
        return i.Type == "NS" && harmonizeName(i.Name) === harmonizeName(name);
    })
        .forEach((i) => {
        var _a;
        (_a = i.ResourceRecords) === null || _a === void 0 ? void 0 : _a.forEach((rrec) => {
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
exports.filterNS = filterNS;
function deleteAddNS(n1, n2) {
    const del = [];
    const add = [];
    n1.forEach((i, idx) => {
        if (!n2[idx] || !(i.Name === n2[idx].Name &&
            i.TTL === n2[idx].TTL &&
            i.ResourceRecord === n2[idx].ResourceRecord)) {
            del.push(i);
        }
    });
    n2.forEach((i, idx) => {
        if (!n1[idx] || !(i.Name === n1[idx].Name &&
            i.TTL === n1[idx].TTL &&
            i.ResourceRecord === n1[idx].ResourceRecord)) {
            add.push(i);
        }
    });
    return { del, add };
}
exports.deleteAddNS = deleteAddNS;
async function walkTree(tree, cb) {
    return Promise.all(Array.from(tree.children.values()).map(async (v) => {
        await cb(tree, v);
        return walkTree(v, cb);
    }));
}
exports.walkTree = walkTree;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tYWluLXRyZWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkb21haW4tdHJlZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFHQSxTQUFnQixhQUFhLENBQUMsSUFBWTtJQUN4QyxPQUFPLElBQUk7U0FDUixpQkFBaUIsRUFBRTtTQUNuQixJQUFJLEVBQUU7U0FDTixPQUFPLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQztTQUNwQixPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLGVBQWU7U0FDbEMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLGdCQUFnQjtBQUN6QyxDQUFDO0FBUEQsc0NBT0M7QUFFRCxTQUFnQixVQUFVLENBQUMsS0FBYTtJQUN0QyxNQUFNLEdBQUcsR0FBYSxFQUFFLENBQUM7SUFDekIsSUFBSSxDQUFDLEdBQWEsRUFBRSxDQUFDO0lBQ3JCLEtBQUs7U0FDRixLQUFLLENBQUMsR0FBRyxDQUFDO1NBQ1YsT0FBTyxFQUFFO1NBQ1QsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7UUFDaEIsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDakIsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDeEIsQ0FBQyxDQUFDLENBQUM7SUFDTCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUM7QUFYRCxnQ0FXQztBQUVELE1BQWEsSUFBSTtJQUFqQjtRQUVFLGFBQVEsR0FBeUIsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQWU3QyxDQUFDO0lBWlEsR0FBRyxDQUFDLElBQVksRUFBRSxHQUFPO1FBQzlCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BDLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDVixLQUFLLEdBQUcsSUFBSSxJQUFJLEVBQUssQ0FBQztZQUN0QixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDaEM7UUFDRCxLQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztRQUNwQixJQUFJLEdBQUcsRUFBRTtZQUNQLEtBQUssQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1NBQ2pCO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0NBQ0Y7QUFqQkQsb0JBaUJDO0FBRUQsU0FBZ0IsYUFBYSxDQUFDLFFBQStCO0lBQzNELE1BQU0sTUFBTSxHQUFHLElBQUksR0FBRyxFQUFnQyxDQUFDO0lBQ3ZELFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtRQUN4QixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO1lBQ3pCLE1BQU0sS0FBSyxHQUFHLGFBQWEsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQy9DLHFEQUFxRDtZQUNyRCxJQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzlCLElBQUksQ0FBQyxLQUFLLEVBQUU7Z0JBQ1YsS0FBSyxHQUFHLEVBQUUsQ0FBQztnQkFDWCxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQzthQUMxQjtZQUNELEtBQUssQ0FBQyxJQUFJLENBQUM7Z0JBQ1QsSUFBSSxFQUFFLEtBQUs7Z0JBQ1gsbUJBQW1CLEVBQUUsSUFBSTtnQkFDekIsSUFBSSxFQUFFLEdBQUc7YUFDVixDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0gsTUFBTSxJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztJQUN4QixNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFO1FBQzdCLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUU7WUFDcEIsT0FBTyxDQUFDLEtBQUssQ0FDWCxPQUFPLEtBQUssOENBQThDLElBQUksQ0FBQyxTQUFTLENBQ3RFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQ3ZELEVBQUUsQ0FDSixDQUFDO1lBQ0YsT0FBTztTQUNSO1FBQ0QsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BCLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQztRQUNsQixVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7WUFDOUIsbUNBQW1DO1lBQ25DLE1BQU0sR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3hELENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDSCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFwQ0Qsc0NBb0NDO0FBU0QsU0FBZ0IsUUFBUSxDQUN0QixJQUFpQyxFQUNqQyxJQUFZO0lBRVosTUFBTSxHQUFHLEdBQXFCLEVBQUUsQ0FBQztJQUNqQyxJQUFJO1NBQ0QsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7UUFDWixPQUFPLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxJQUFJLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3pFLENBQUMsQ0FBQztTQUNELE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFOztRQUNiLE1BQUEsQ0FBQyxDQUFDLGVBQWUsMENBQUUsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDbEMsR0FBRyxDQUFDLElBQUksQ0FBQztnQkFDUCxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUk7Z0JBQ1osSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJO2dCQUNaLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRztnQkFDVixjQUFjLEVBQUUsSUFBSSxDQUFDLEtBQUs7YUFDM0IsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxFQUFFO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDdkIsSUFBSSxDQUFDLENBQUMsY0FBYyxHQUFHLENBQUMsQ0FBQyxjQUFjLEVBQUU7WUFDdkMsT0FBTyxDQUFDLENBQUMsQ0FBQztTQUNYO1FBQ0QsSUFBSSxDQUFDLENBQUMsY0FBYyxHQUFHLENBQUMsQ0FBQyxjQUFjLEVBQUU7WUFDdkMsT0FBTyxDQUFDLENBQUM7U0FDVjtRQUNELE9BQU8sQ0FBQyxDQUFDO0lBQ1gsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBNUJELDRCQTRCQztBQUVELFNBQWdCLFdBQVcsQ0FBQyxFQUFvQixFQUFFLEVBQW9CO0lBQ3BFLE1BQU0sR0FBRyxHQUFxQixFQUFFLENBQUM7SUFDakMsTUFBTSxHQUFHLEdBQXFCLEVBQUUsQ0FBQztJQUNqQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFO1FBQ3BCLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUNmLENBQUMsQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUk7WUFDdkIsQ0FBQyxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRztZQUNyQixDQUFDLENBQUMsY0FBYyxLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxjQUFjLENBQzFDLEVBQUU7WUFDSCxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2I7SUFDSCxDQUFDLENBQUMsQ0FBQztJQUNILEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUU7UUFDcEIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQ2YsQ0FBQyxDQUFDLElBQUksS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSTtZQUN2QixDQUFDLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHO1lBQ3JCLENBQUMsQ0FBQyxjQUFjLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FDMUMsRUFBRTtZQUNILEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDYjtJQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0gsT0FBTyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztBQUN0QixDQUFDO0FBdEJELGtDQXNCQztBQUVNLEtBQUssVUFBVSxRQUFRLENBQzVCLElBQWEsRUFDYixFQUFxRDtJQUVyRCxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQ2hCLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDakQsTUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2xCLE9BQU8sUUFBUSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUN6QixDQUFDLENBQUMsQ0FDSCxDQUFDO0FBQ0osQ0FBQztBQVZELDRCQVVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWNjb3VudHNIb3N0ZWRab25lLCBBY2NvdW50c0hvc3RlZFpvbmVzIH0gZnJvbSBcIi4vYXdzLWJpbmRpbmdcIjtcbmltcG9ydCB7IFJvdXRlNTMgfSBmcm9tICdhd3Mtc2RrJztcblxuZXhwb3J0IGZ1bmN0aW9uIGhhcm1vbml6ZU5hbWUobmFtZTogc3RyaW5nKSB7XG4gIHJldHVybiBuYW1lXG4gICAgLnRvTG9jYWxlTG93ZXJDYXNlKClcbiAgICAudHJpbSgpXG4gICAgLnJlcGxhY2UoL1xcLisvZywgXCIuXCIpXG4gICAgLnJlcGxhY2UoL15cXC4vLCBcIlwiKSAvLyBubyBsZWFkaW5nIC5cbiAgICAucmVwbGFjZSgvXFwuJC8sIFwiXCIpOyAvLyBubyB0cmFpbGluZyAuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXZEb21haW5zKGRuYW1lOiBzdHJpbmcpIHtcbiAgY29uc3Qgb3V0OiBzdHJpbmdbXSA9IFtdO1xuICBsZXQgZDogc3RyaW5nW10gPSBbXTtcbiAgZG5hbWVcbiAgICAuc3BsaXQoXCIuXCIpXG4gICAgLnJldmVyc2UoKVxuICAgIC5mb3JFYWNoKChwYXJ0KSA9PiB7XG4gICAgICBkID0gW3BhcnQsIC4uLmRdO1xuICAgICAgb3V0LnB1c2goZC5qb2luKFwiLlwiKSk7XG4gICAgfSk7XG4gIHJldHVybiBvdXQ7XG59XG5cbmV4cG9ydCBjbGFzcyBMZWFmPFQgPSBBY2NvdW50c0hvc3RlZFpvbmU+IHtcbiAgcGFyZW50PzogTGVhZjxUPjtcbiAgY2hpbGRyZW46IE1hcDxzdHJpbmcsIExlYWY8VD4+ID0gbmV3IE1hcCgpO1xuICByZWY/OiBUO1xuXG4gIHB1YmxpYyBhZGQobmFtZTogc3RyaW5nLCByZWY/OiBUKTogTGVhZjxUPiB7XG4gICAgbGV0IGZvdW5kID0gdGhpcy5jaGlsZHJlbi5nZXQobmFtZSk7XG4gICAgaWYgKCFmb3VuZCkge1xuICAgICAgZm91bmQgPSBuZXcgTGVhZjxUPigpO1xuICAgICAgdGhpcy5jaGlsZHJlbi5zZXQobmFtZSwgZm91bmQpO1xuICAgIH1cbiAgICBmb3VuZC5wYXJlbnQgPSB0aGlzO1xuICAgIGlmIChyZWYpIHtcbiAgICAgIGZvdW5kLnJlZiA9IHJlZjtcbiAgICB9XG4gICAgcmV0dXJuIGZvdW5kO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZFpvbmVUcmVlKGFjY291bnRzOiBBY2NvdW50c0hvc3RlZFpvbmVzW10pIHtcbiAgY29uc3QgZG5hbWVzID0gbmV3IE1hcDxzdHJpbmcsIEFjY291bnRzSG9zdGVkWm9uZVtdPigpO1xuICBhY2NvdW50cy5mb3JFYWNoKChhaHpzKSA9PiB7XG4gICAgYWh6cy56b25lcy5mb3JFYWNoKChoemkpID0+IHtcbiAgICAgIGNvbnN0IGRuYW1lID0gaGFybW9uaXplTmFtZShoemkuaG9zdFpvbmUuTmFtZSk7XG4gICAgICAvLyBjb25zb2xlLmxvZyhgZG5hbWU9JHtkbmFtZX06JHtoemkuaG9zdFpvbmUuTmFtZX1gKVxuICAgICAgbGV0IGZvdW5kID0gZG5hbWVzLmdldChkbmFtZSk7XG4gICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgIGZvdW5kID0gW107XG4gICAgICAgIGRuYW1lcy5zZXQoZG5hbWUsIGZvdW5kKTtcbiAgICAgIH1cbiAgICAgIGZvdW5kLnB1c2goe1xuICAgICAgICBuYW1lOiBkbmFtZSxcbiAgICAgICAgYWNjb3VudHNIb3N0ZWRab25lczogYWh6cyxcbiAgICAgICAgem9uZTogaHppLFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuICBjb25zdCByb290ID0gbmV3IExlYWYoKTtcbiAgZG5hbWVzLmZvckVhY2goKGFoenMsIGRuYW1lKSA9PiB7XG4gICAgaWYgKGFoenMubGVuZ3RoICE9IDEpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgIGBUaGUgJHtkbmFtZX0gaXMgc2tpcHBlZCBpcyBvd25lZCBieSBtdWx0aXBsZSBhY2NvdW50czogJHtKU09OLnN0cmluZ2lmeShcbiAgICAgICAgICBhaHpzLm1hcCgoaSkgPT4gaS5hY2NvdW50c0hvc3RlZFpvbmVzLmFjY291bnQucm9sZUFybilcbiAgICAgICAgKX1gXG4gICAgICApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBhaHogPSBhaHpzWzBdO1xuICAgIGxldCBwYXJlbnQgPSByb290O1xuICAgIHJldkRvbWFpbnMoZG5hbWUpLmZvckVhY2goKGQpID0+IHtcbiAgICAgIC8vIGNvbnNvbGUubG9nKGAke2RuYW1lfSA9PT0gJHtkfWApXG4gICAgICBwYXJlbnQgPSBwYXJlbnQuYWRkKGQsIGRuYW1lID09PSBkID8gYWh6IDogdW5kZWZpbmVkKTtcbiAgICB9KTtcbiAgfSk7XG4gIHJldHVybiByb290O1xufVxuXG5pbnRlcmZhY2UgUmVzb3VyY2VSZWNvcmQge1xuICBOYW1lOiBzdHJpbmc7XG4gIFR5cGU6IHN0cmluZztcbiAgVFRMPzogbnVtYmVyO1xuICBSZXNvdXJjZVJlY29yZDogc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyTlMoXG4gIHJyc3M6IFJvdXRlNTMuUmVzb3VyY2VSZWNvcmRTZXRbXSxcbiAgbmFtZTogc3RyaW5nXG4pOiBSZXNvdXJjZVJlY29yZFtdIHtcbiAgY29uc3QgcmV0OiBSZXNvdXJjZVJlY29yZFtdID0gW107XG4gIHJyc3NcbiAgICAuZmlsdGVyKChpKSA9PiB7XG4gICAgICByZXR1cm4gaS5UeXBlID09IFwiTlNcIiAmJiBoYXJtb25pemVOYW1lKGkuTmFtZSkgPT09IGhhcm1vbml6ZU5hbWUobmFtZSk7XG4gICAgfSlcbiAgICAuZm9yRWFjaCgoaSkgPT4ge1xuICAgICAgaS5SZXNvdXJjZVJlY29yZHM/LmZvckVhY2goKHJyZWMpID0+IHtcbiAgICAgICAgcmV0LnB1c2goe1xuICAgICAgICAgIE5hbWU6IGkuTmFtZSxcbiAgICAgICAgICBUeXBlOiBpLlR5cGUsXG4gICAgICAgICAgVFRMOiBpLlRUTCxcbiAgICAgICAgICBSZXNvdXJjZVJlY29yZDogcnJlYy5WYWx1ZSxcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgcmV0dXJuIHJldC5zb3J0KChhLCBiKSA9PiB7XG4gICAgaWYgKGEuUmVzb3VyY2VSZWNvcmQgPCBiLlJlc291cmNlUmVjb3JkKSB7XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIGlmIChhLlJlc291cmNlUmVjb3JkID4gYi5SZXNvdXJjZVJlY29yZCkge1xuICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIHJldHVybiAwO1xuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlbGV0ZUFkZE5TKG4xOiBSZXNvdXJjZVJlY29yZFtdLCBuMjogUmVzb3VyY2VSZWNvcmRbXSkge1xuICBjb25zdCBkZWw6IFJlc291cmNlUmVjb3JkW10gPSBbXTtcbiAgY29uc3QgYWRkOiBSZXNvdXJjZVJlY29yZFtdID0gW107XG4gIG4xLmZvckVhY2goKGksIGlkeCkgPT4ge1xuICAgIGlmICghbjJbaWR4XSB8fCAhKFxuICAgICAgaS5OYW1lID09PSBuMltpZHhdLk5hbWUgJiZcbiAgICAgIGkuVFRMID09PSBuMltpZHhdLlRUTCAmJlxuICAgICAgaS5SZXNvdXJjZVJlY29yZCA9PT0gbjJbaWR4XS5SZXNvdXJjZVJlY29yZFxuICAgICAgKSkge1xuICAgICAgZGVsLnB1c2goaSk7XG4gICAgfVxuICB9KTtcbiAgbjIuZm9yRWFjaCgoaSwgaWR4KSA9PiB7XG4gICAgaWYgKCFuMVtpZHhdIHx8ICEoXG4gICAgICBpLk5hbWUgPT09IG4xW2lkeF0uTmFtZSAmJlxuICAgICAgaS5UVEwgPT09IG4xW2lkeF0uVFRMICYmXG4gICAgICBpLlJlc291cmNlUmVjb3JkID09PSBuMVtpZHhdLlJlc291cmNlUmVjb3JkXG4gICAgICApKSB7XG4gICAgICBhZGQucHVzaChpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4geyBkZWwsIGFkZCB9O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd2Fsa1RyZWU8VD4oXG4gIHRyZWU6IExlYWY8VD4sXG4gIGNiOiAodG9wOiBMZWFmPFQ+LCBkb3duOiBMZWFmPFQ+KSA9PiBQcm9taXNlPHVua25vd24+XG4pOiBQcm9taXNlPHVua25vd25bXT4ge1xuICByZXR1cm4gUHJvbWlzZS5hbGwoXG4gICAgQXJyYXkuZnJvbSh0cmVlLmNoaWxkcmVuLnZhbHVlcygpKS5tYXAoYXN5bmMgKHYpID0+IHtcbiAgICAgIGF3YWl0IGNiKHRyZWUsIHYpO1xuICAgICAgcmV0dXJuIHdhbGtUcmVlKHYsIGNiKTtcbiAgICB9KVxuICApO1xufVxuIl19