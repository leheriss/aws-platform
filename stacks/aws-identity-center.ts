import { StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import SSOAssignments from '../constructs/ssoAssignments';
import { Assignment } from '../types';
import { BaseStack } from './baseStack';
import { SSOPermissionSet } from '../constructs/ssoPermissionSet';
import { IdentityCenterGroup } from '../constructs/identityCenterGroup';

type AwsSsoStackProps = StackProps & {
  accountId: string;
  ssoInstanceArn: string;
  identityStoreId: string;
};

export class AwsIdentityCenterStack extends BaseStack {
  public readonly adminSSOGroupId: string;

  public readonly adminSSOPermissionSetArn: string;

  constructor(scope: Construct, id: string, props: AwsSsoStackProps) {
    const { accountId, ssoInstanceArn, identityStoreId } = props;
    super(scope, id, {
      ...props,
    });

    // GROUPS

    const adminGroup = new IdentityCenterGroup(this, 'Admin', {
      groupName: 'Admin',
      identityStoreId,
    });
    this.adminSSOGroupId = adminGroup.id;

    const readOnlyGroup = new IdentityCenterGroup(this, 'ReadOnly', {
      groupName: 'ReadOnly',
      identityStoreId,
    });

    // PERMISSION SETS

    const adminPermissionSet = new SSOPermissionSet(this, 'Admin', {
      instanceArn: ssoInstanceArn,
      managedPolicies: ['arn:aws:iam::aws:policy/AdministratorAccess'],
    });

    const viewOnlyPermissionSet = new SSOPermissionSet(this, 'ViewOnly', {
      instanceArn: ssoInstanceArn,
      managedPolicies: ['arn:aws:iam::aws:policy/job-function/ViewOnlyAccess'],
    });

    this.adminSSOPermissionSetArn = adminPermissionSet.attrPermissionSetArn;

    // ASSIGNMENTS TO GROUPS

    const assignments: Assignment[] = [
      {
        groupId: adminGroup.id,
        groupName: adminGroup.name,
        accountPermissionSets: [
          {
            permissionSet: adminPermissionSet,
            account: accountId,
          },
        ],
      },
      {
        groupId: readOnlyGroup.id,
        groupName: readOnlyGroup.name,
        accountPermissionSets: [
          {
            permissionSet: viewOnlyPermissionSet,
            account: accountId,
          },
        ],
      },
    ];

    new SSOAssignments(this, 'SSOAssignments', {
      ssoInstanceArn: props.ssoInstanceArn,
      assignments,
    });
  }
}
