import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import { AWSDelegation53Stack } from '../lib/aws-delegation53-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new AWSDelegation53Stack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
