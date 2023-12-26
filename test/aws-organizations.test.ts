import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';

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

test('Organization and SCP created', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new Organizations.AwsOrganizationsStack(app, 'MyTestStack', {
    accountId: '123456789101',
    rootOrganizationId: 'r-123',
    configFilePath: './config.json',
  });
  // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::Organizations::OrganizationalUnit', {
    Name: 'Pending Deletion',
    ParentId: 'r-123',
  });

  template.hasResourceProperties('AWS::Organizations::Policy', {
    Name: 'PendingDeletion',
    Type: 'SERVICE_CONTROL_POLICY',
    Content: Match.anyValue(),
    Description: 'Policy denying everything but the actions to close the account',
  });
});
