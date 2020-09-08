#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AWSDelegation53Stack } from '../lib/aws-delegation53-stack';

const app = new cdk.App();
new AWSDelegation53Stack(app, 'AWSDelegation53Stack');
