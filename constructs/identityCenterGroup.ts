import { Construct } from 'constructs';
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  PhysicalResourceId,
  PhysicalResourceIdReference,
} from 'aws-cdk-lib/custom-resources';

export interface IdentityCenterGroupProps {
  groupName: string;
  identityStoreId: string;
}

export class IdentityCenterGroup extends Construct {
  public readonly id: string;
  public readonly name: string;
  constructor(scope: Construct, id: string, props: IdentityCenterGroupProps) {
    super(scope, id);

    const { groupName, identityStoreId } = props;

    this.name = groupName;

    const group = new AwsCustomResource(scope, `${groupName}SSOGroup`, {
      onCreate: {
        service: '@aws-sdk/client-identitystore',
        action: 'CreateGroup',
        parameters: {
          GroupName: groupName,
          IdentityStoreId: identityStoreId,
          DisplayName: groupName,
        },
        physicalResourceId: PhysicalResourceId.fromResponse('GroupId'),
      },
      onUpdate: {
        service: '@aws-sdk/client-identitystore',
        action: 'UpdateGroup',
        parameters: {
          IdentityStoreId: identityStoreId,
          GroupId: new PhysicalResourceIdReference(),
          Operations: [{ AttributePath: 'DisplayName', AttributeValue: groupName }],
        },
      },
      onDelete: {
        service: '@aws-sdk/client-identitystore',
        action: 'DeleteGroup',
        parameters: {
          IdentityStoreId: identityStoreId,
          GroupId: new PhysicalResourceIdReference(),
        },
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });

    this.id = group.getResponseField('GroupId');
  }
}
