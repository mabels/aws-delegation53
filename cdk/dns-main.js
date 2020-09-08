"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("@aws-cdk/core");
const dns_stack_1 = require("./dns-stack");
const app = new cdk.App();
console.log('--------');
new dns_stack_1.DNSStack(app, 'TOP-Test-DNS', {
    env: { region: "eu-central-1" },
    dnsAdmin: "top-test-dns",
    domains: ['top-1.cloud', 'top-2.cloud']
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG5zLW1haW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkbnMtbWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHFDQUFzQztBQUN0QywyQ0FBdUM7QUFFdkMsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDMUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQTtBQUN2QixJQUFJLG9CQUFRLENBQUMsR0FBRyxFQUFFLGNBQWMsRUFBRTtJQUNoQyxHQUFHLEVBQUUsRUFBQyxNQUFNLEVBQUUsY0FBYyxFQUFDO0lBQzdCLFFBQVEsRUFBRSxjQUFjO0lBQ3hCLE9BQU8sRUFBRSxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUM7Q0FDeEMsQ0FBQyxDQUFDO0FBQ0gsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNkayA9IHJlcXVpcmUoJ0Bhd3MtY2RrL2NvcmUnKTtcbmltcG9ydCB7IEROU1N0YWNrIH0gZnJvbSAnLi9kbnMtc3RhY2snO1xuXG5jb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuY29uc29sZS5sb2coJy0tLS0tLS0tJylcbm5ldyBETlNTdGFjayhhcHAsICdUT1AtVGVzdC1ETlMnLCB7XG4gIGVudjoge3JlZ2lvbjogXCJldS1jZW50cmFsLTFcIn0sXG4gIGRuc0FkbWluOiBcInRvcC10ZXN0LWRuc1wiLFxuICBkb21haW5zOiBbJ3RvcC0xLmNsb3VkJywgJ3RvcC0yLmNsb3VkJ11cbn0pO1xuYXBwLnN5bnRoKCk7XG4iXX0=