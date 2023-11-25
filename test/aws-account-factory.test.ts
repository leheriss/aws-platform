import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

import * as AwsAccountFactory from '../stacks/aws-account-factory';
import * as Organizations from '../stacks/aws-organizations';

test('has lambdas to create and delete account', async () => {
  const app = new cdk.App();
  // WHEN
  const organizationsStack = new Organizations.AwsOrganizationsStack(app, 'MyOrgStack', {
    accountId: '123456789101',
    rootOrganizationId: 'r-123',
  });
  const stack = new AwsAccountFactory.AwsAccountFactoryStack(app, 'MyAccFactoryStack', {
    accountId: '123456789101',
    ssoAdminGroupId: '0a13eae2-f2ec-4974-9731-09d2b954b96e',
    ssoAdminPermissionSetArn: 'permission-set-arn',
    ssoInstanceArn: 'sso-instance-arn',
    pendingDeletionOU: organizationsStack.pendingDeletionOu,
  });
  // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::Lambda::Function', {
    FunctionName: 'MyAccFactoryStack-create-account',
    Runtime: 'nodejs20.x',
    Handler: 'index.handler',
    Timeout: 900,
    Architectures: ['arm64'],
  });
  template.hasResourceProperties('AWS::Lambda::Function', {
    FunctionName: 'MyAccFactoryStack-delete-account',
    Runtime: 'nodejs20.x',
    Handler: 'index.handler',
    Timeout: 900,
    Architectures: ['arm64'],
  });
  template.hasResourceProperties('AWS::Lambda::Function', {
    FunctionName: 'MyAccFactoryStack-delete-pending-deletion-accounts',
    Runtime: 'nodejs20.x',
    Handler: 'index.handler',
    Timeout: 900,
    Architectures: ['arm64'],
  });
});
