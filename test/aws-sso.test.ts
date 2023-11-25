import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

import * as AwsSso from '../stacks/aws-identity-center';
import { Group } from '../types';

test('Admin PermissionSet Created', async () => {
  const ssoGroups: Group[] = [
    {
      id: 'e032f5e6-dab2-4189-bd48-a6e0b68d5458',
      name: 'Admin',
    },
    {
      id: 'e032f5e6-dab2-4189-bd48-a6e0b68d5459',
      name: 'ReadOnly',
    },
  ];
  const app = new cdk.App({});

  // WHEN
  const stack = new AwsSso.AwsIdentityCenterStack(app, 'MyTestStack', {
    accountId: '123456789101',
    ssoInstanceArn: 'test',
    ssoGroups,
  });

  //THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::SSO::PermissionSet', {
    Name: 'Admin',
    ManagedPolicies: ['arn:aws:iam::aws:policy/AdministratorAccess'],
    SessionDuration: 'PT12H',
  });
});

test('Admin PermissionSet Asignment Created', async () => {
  const ssoGroups: Group[] = [
    {
      id: 'e032f5e6-dab2-4189-bd48-a6e0b68d5458',
      name: 'Admin',
    },
    {
      id: 'e032f5e6-dab2-4189-bd48-a6e0b68d5459',
      name: 'ReadOnly',
    },
  ];

  const app = new cdk.App({ context: ssoGroups });

  // WHEN
  const stack = new AwsSso.AwsIdentityCenterStack(app, 'MyTestStack', {
    accountId: '123456789101',
    ssoInstanceArn: 'test',
    ssoGroups,
  });
  // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::SSO::Assignment', {
    PrincipalType: 'GROUP',
    PrincipalId: 'e032f5e6-dab2-4189-bd48-a6e0b68d5458',
    TargetId: '123456789101',
    TargetType: 'AWS_ACCOUNT',
    PermissionSetArn: {
      'Fn::GetAtt': ['AdminPermissionSet', 'PermissionSetArn'],
    },
  });
});
