import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';

import * as AwsSso from '../stacks/aws-identity-center';

jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  loadYamlConfig: jest.fn().mockImplementation(() => ({
    // Mocked configuration object
    groups: [
      {
        name: 'Admin',
      },
    ],
    permissionSets: [
      {
        name: 'Admin',
        managedPolicies: ['arn:aws:iam::aws:policy/AdministratorAccess'],
      },
    ],
    assignments: [
      {
        accountId: '012345678910',
        permissions: [
          {
            groupName: 'Admin',
            permissionSets: ['Admin'],
          },
        ],
      },
    ],
  })),
}));

test('Admin PermissionSet Created', async () => {
  const app = new cdk.App({});

  // WHEN
  const stack = new AwsSso.AwsIdentityCenterStack(app, 'MyTestStack', {
    accountId: '123456789101',
    ssoInstanceArn: 'test',
    identityStoreId: 'd-xxxxx',
    configFilePath: 'aws-sso-config.json',
  });

  //THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::SSO::PermissionSet', {
    Name: 'Admin',
    ManagedPolicies: ['arn:aws:iam::aws:policy/AdministratorAccess'],
    SessionDuration: 'PT12H',
  });
});

test('Admin group Created', async () => {
  const app = new cdk.App({});

  // WHEN
  const stack = new AwsSso.AwsIdentityCenterStack(app, 'MyTestStack', {
    accountId: '123456789101',
    ssoInstanceArn: 'test',
    identityStoreId: 'd-xxxxx',
    configFilePath: 'aws-sso-config.json',
  });

  //THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties('Custom::AWS', {
    Create: Match.stringLikeRegexp(`.*"DisplayName":".*Admin.*".*`),
  });
});

test('Admin PermissionSet Asignment Created', async () => {
  const app = new cdk.App();

  // WHEN
  const stack = new AwsSso.AwsIdentityCenterStack(app, 'MyTestStack', {
    accountId: '123456789101',
    ssoInstanceArn: 'test',
    identityStoreId: 'd-xxx',
    configFilePath: 'aws-sso-config.json',
  });
  // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::SSO::Assignment', {
    PrincipalType: 'GROUP',
    PrincipalId: Match.objectLike({
      'Fn::GetAtt': Match.arrayWith([Match.stringLikeRegexp('.*Admin.*')]),
    }),
    TargetId: '012345678910',
    TargetType: 'AWS_ACCOUNT',
    PermissionSetArn: {
      'Fn::GetAtt': ['AdminPermissionSet', 'PermissionSetArn'],
    },
  });
});
