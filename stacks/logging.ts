import { Stack, StackProps } from 'aws-cdk-lib';
import { DataResourceType, ReadWriteType, Trail } from 'aws-cdk-lib/aws-cloudtrail';
import { PolicyStatement, ServicePrincipal, Effect } from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { BaseStack } from './baseStack';

type LoggingStackProps = StackProps & {
  accountId: string;
  awsOrganizationsId: string;
};

export class LoggingStack extends BaseStack {
  constructor(scope: Construct, id: string, props: LoggingStackProps) {
    super(scope, id, props);

    const { awsOrganizationsId } = props;

    const { region, account } = Stack.of(this);
    const trailName = 'OrganizationTrail';

    const trailBucket: Bucket = new Bucket(this, 'OrganizationsTrailBucket', {
      bucketName: `${account}-organizations-trail`,
    });

    trailBucket.addToResourcePolicy(
      new PolicyStatement({
        resources: [trailBucket.bucketArn],
        actions: ['s3:GetBucketAcl'],
        principals: [new ServicePrincipal('cloudtrail.amazonaws.com')],
        effect: Effect.ALLOW,
        sid: 'AWSCloudTrailAclCheck',
      }),
    );
    trailBucket.addToResourcePolicy(
      new PolicyStatement({
        resources: [`${trailBucket.bucketArn}/AWSLogs/${account}/*`],
        effect: Effect.ALLOW,
        actions: ['s3:PutObject'],
        principals: [new ServicePrincipal('cloudtrail.amazonaws.com')],
        sid: 'AWSCloudTrailWrite',
        conditions: {
          StringEquals: {
            's3:x-amz-acl': 'bucket-owner-full-control',
            'aws:SourceArn': `arn:aws:cloudtrail:${region}:${account}:trail/${trailName}`,
          },
        },
      }),
    );
    trailBucket.addToResourcePolicy(
      new PolicyStatement({
        resources: [`arn:aws:s3:::${trailBucket.bucketName}/AWSLogs/${awsOrganizationsId}/*`],
        effect: Effect.ALLOW,
        actions: ['s3:PutObject'],
        principals: [new ServicePrincipal('cloudtrail.amazonaws.com')],
        sid: 'AWSCloudTrailWriteOrganization',
        conditions: {
          StringEquals: {
            's3:x-amz-acl': 'bucket-owner-full-control',
            'aws:SourceArn': `arn:aws:cloudtrail:${region}:${account}:trail/${trailName}`,
          },
        },
      }),
    );

    const orgTrail = new Trail(this, trailName, {
      bucket: trailBucket,
      isOrganizationTrail: true,
      trailName,
      isMultiRegionTrail: true,
      includeGlobalServiceEvents: true,
      managementEvents: ReadWriteType.ALL,
    });

    orgTrail.addEventSelector(DataResourceType.S3_OBJECT, ['arn:aws:s3']);
  }
}
