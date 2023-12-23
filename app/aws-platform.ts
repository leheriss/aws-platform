#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AwsAccountFactoryStack } from '../stacks/aws-account-factory';
import { AwsOrganizationsStack } from '../stacks/aws-organizations';
import { AwsIdentityCenterStack } from '../stacks/aws-identity-center';
import { FinOpsStack } from '../stacks/finops';
import { LoggingStack } from '../stacks/logging';

const app = new cdk.App();

const adminEmailsParameterName = app.node.tryGetContext('adminEmailsParameterName') as string;

const managementAccountId = app.node.tryGetContext('mgmtAccountId') as string;

const ssoInstanceArn = app.node.tryGetContext('ssoInstanceArn') as string;

const rootOuId = app.node.tryGetContext('rootOuId') as string;

const awsOrganizationsId = app.node.tryGetContext('awsOrganizationsId') as string;

const identityStoreId = app.node.tryGetContext('identityStoreId') as string;

if (!rootOuId || rootOuId == '') {
  throw new Error(
    'No root OU Id in AWS Organizations, cannot deploy Organizations nor Account Factory stacks',
  );
}

const organizationsStack = new AwsOrganizationsStack(app, 'AwsOrganizationsStack', {
  rootOrganizationId: rootOuId,
  accountId: managementAccountId,
});

const identityCenterStack = new AwsIdentityCenterStack(app, 'AwsIdentityCenterStack', {
  accountId: managementAccountId,
  ssoInstanceArn,
  identityStoreId,
});

new AwsAccountFactoryStack(app, 'AwsAccountFactoryStack', {
  accountId: managementAccountId,
  ssoInstanceArn,
  ssoAdminGroupId: identityCenterStack.adminSSOGroupId,
  ssoAdminPermissionSetArn: identityCenterStack.adminSSOPermissionSetArn,
  pendingDeletionOU: organizationsStack.pendingDeletionOu,
});

new FinOpsStack(app, 'FinOpsStack', {
  accountId: managementAccountId,
  adminEmailsParameterName,
});

if (!awsOrganizationsId || awsOrganizationsId == '') {
  throw new Error('Cannot find AWS Organizations Id, cannot deploy Logging Stack');
}

new LoggingStack(app, 'LoggingStack', {
  accountId: managementAccountId,
  awsOrganizationsId,
});
