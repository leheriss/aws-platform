import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

import * as AwsAccountFactory from '../stacks/aws-account-factory';
import * as Organizations from '../stacks/aws-organizations';

jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  loadYamlConfig: jest.fn().mockImplementation(() => ({
    // Mocked configuration object
    organizationUnits: [
      /* ... */
    ],
    serviceControlPolicies: [
      /* ... */
    ],
    // Add other properties as needed for your test
  })),
}));

test('has lambdas to create and delete account', async () => {
  const app = new cdk.App();
  // WHEN
  const organizationsStack = new Organizations.AwsOrganizationsStack(app, 'MyOrgStack', {
    accountId: '123456789101',
    rootOrganizationId: 'r-123',
    configFilePath: 'config.json',
  });
  const stack = new AwsAccountFactory.AwsAccountFactoryStack(app, 'MyAccFactoryStack', {
    accountId: '123456789101',
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
