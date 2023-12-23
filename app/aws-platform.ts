#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as dotenv from 'dotenv';

import { AwsAccountFactoryStack } from '../stacks/aws-account-factory';
import { AwsOrganizationsStack } from '../stacks/aws-organizations';
import { AwsIdentityCenterStack } from '../stacks/aws-identity-center';
import { FinOpsStack } from '../stacks/finops';
import { Group } from '../types';
import { LoggingStack } from '../stacks/logging';

dotenv.config();

const app = new cdk.App();

if (!process.env.ADMIN_EMAILS_PARAMETER_NAME) {
  throw new Error('No EMAIL provided in environment variables.');
}
if (!process.env.MGMT_ACCOUNT_ID) {
  throw new Error('No MGMT_ACCOUNT_ID provided in environment variables.');
}
if (!process.env.SSO_INSTANCE_ARN) {
  throw new Error('No SSO_INSTANCE_ARN provided in environment variables.');
}

const rootOuId = app.node.tryGetContext('rootOuId') as string;

if (!rootOuId || rootOuId == '') {
  throw new Error(
    'No root OU Id in AWS Organizations, cannot deploy Organizations nor Account Factory stacks',
  );
} else {
  const organizationsStack = new AwsOrganizationsStack(app, 'AwsOrganizationsStack', {
    rootOrganizationId: rootOuId,
    accountId: process.env.MGMT_ACCOUNT_ID,
  });

  const ssoGroups = app.node.tryGetContext('ssoGroups') as string;

  if (!ssoGroups || ssoGroups == '[]') {
    throw new Error(
      'No SSO groups found in Identity Center, cannot deploy Identity Center nor Account Factory stacks',
    );
  } else {
    const identityCenterStack = new AwsIdentityCenterStack(app, 'AwsIdentityCenterStack', {
      accountId: process.env.MGMT_ACCOUNT_ID,
      ssoInstanceArn: process.env.SSO_INSTANCE_ARN,
      ssoGroups: JSON.parse(ssoGroups) as Group[],
    });

    new AwsAccountFactoryStack(app, 'AwsAccountFactoryStack', {
      accountId: process.env.MGMT_ACCOUNT_ID,
      ssoInstanceArn: process.env.SSO_INSTANCE_ARN,
      ssoAdminGroupId: identityCenterStack.adminSSOGroupId,
      ssoAdminPermissionSetArn: identityCenterStack.adminSSOPermissionSetArn,
      pendingDeletionOU: organizationsStack.pendingDeletionOu,
    });
  }
}

new FinOpsStack(app, 'FinOpsStack', {
  accountId: process.env.MGMT_ACCOUNT_ID,
  adminEmailsParameterName: process.env.ADMIN_EMAILS_PARAMETER_NAME,
});

const awsOrganizationsId = app.node.tryGetContext('awsOrganizationsId') as string;

if (!awsOrganizationsId || awsOrganizationsId == '') {
  throw new Error('Cannot find AWS Organizations Id, cannot deploy Logging Stack');
} else {
  new LoggingStack(app, 'LoggingStack', {
    accountId: process.env.MGMT_ACCOUNT_ID,
    awsOrganizationsId,
  });
}
