import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';

import * as Logging from '../stacks/logging';

test('has Organization trail', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new Logging.LoggingStack(app, 'MyTestStack', {
    awsOrganizationsId: 'ou-123',
    accountId: '123456789101',
  });
  // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::S3::Bucket', {
    BucketName: '123456789101-organizations-trail',
  });
  template.hasResourceProperties('AWS::CloudTrail::Trail', {
    IsLogging: true,
    S3BucketName: Match.anyValue(),
    IsOrganizationTrail: true,
    TrailName: 'OrganizationTrail',
  });
});
