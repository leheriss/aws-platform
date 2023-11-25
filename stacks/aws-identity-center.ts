import { StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import SSOAssignments from '../constructs/ssoAssignments';
import { getGroupWithName } from '../utils';
import { Assignment, Group } from '../types';
import { BaseStack } from '../constructs/baseStack';
import { SSOPermissionSet } from '../constructs/ssoPermissionSet';

type AwsSsoStackProps = StackProps & {
  accountId: string;
  ssoInstanceArn: string;
  ssoGroups: Group[];
};

export class AwsIdentityCenterStack extends BaseStack {
  public readonly adminSSOGroupId: string;

  public readonly adminSSOPermissionSetArn: string;

  constructor(scope: Construct, id: string, props: AwsSsoStackProps) {
    const { accountId, ssoInstanceArn, ssoGroups } = props;
    super(scope, id, {
      ...props,
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

    this.adminSSOGroupId = getGroupWithName(ssoGroups, 'Admin').id;
    this.adminSSOPermissionSetArn = adminPermissionSet.attrPermissionSetArn;

    // ASSIGNMENTS TO GROUPS

    const assignments: Assignment[] = [
      {
        group: getGroupWithName(ssoGroups, 'Admin'),
        accountPermissionSets: [
          {
            permissionSet: adminPermissionSet,
            account: accountId,
          },
        ],
      },
      {
        group: getGroupWithName(ssoGroups, 'ReadOnly'),
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
