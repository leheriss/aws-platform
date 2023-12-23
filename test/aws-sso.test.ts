import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';

import * as AwsSso from '../stacks/aws-identity-center';

test('Admin PermissionSet Created', async () => {
  const app = new cdk.App({});

  // WHEN
  const stack = new AwsSso.AwsIdentityCenterStack(app, 'MyTestStack', {
    accountId: '123456789101',
    ssoInstanceArn: 'test',
    identityStoreId: 'd-xxxxx',
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
  });
  // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::SSO::Assignment', {
    PrincipalType: 'GROUP',
    PrincipalId: Match.objectLike({
      'Fn::GetAtt': Match.arrayWith([Match.stringLikeRegexp('.*Admin.*')]),
    }),
    TargetId: '123456789101',
    TargetType: 'AWS_ACCOUNT',
    PermissionSetArn: {
      'Fn::GetAtt': ['AdminPermissionSet', 'PermissionSetArn'],
    },
  });
});
