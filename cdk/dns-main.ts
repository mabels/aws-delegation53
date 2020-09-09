import cdk = require('@aws-cdk/core');
import { DNSStack } from './dns-stack';

const app = new cdk.App();
console.log('--------')
new DNSStack(app, 'TOP-Test-DNS', {
  env: {region: "eu-central-1"},
  dnsAdmin: "top-test-dns",
  delegation53Arn: "arn:aws:iam::167250265666:role/delegation53",
  domains: ['top-1.cloud', 'top-2.cloud']
});
app.synth();
