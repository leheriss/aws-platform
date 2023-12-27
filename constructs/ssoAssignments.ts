import { CfnAssignment } from 'aws-cdk-lib/aws-sso';
import { Construct } from 'constructs';

import { Assignment } from '../types';
import { getAwsAccountId } from '../utils';

type SSOAssignmentsProps = {
  assignments: Assignment[];
  ssoInstanceArn: string;
};

class SSOAssignments extends Construct {
  constructor(scope: Construct, id: string, props: SSOAssignmentsProps) {
    super(scope, id);

    const { assignments, ssoInstanceArn } = props;

    assignments.forEach(assignment => {
      const { account } = assignment;
      // The account can be either a platform account (CfnAccount) or directly the account Id
      // if the account comes from outside CDK management
      const accountId = getAwsAccountId(account);
      assignment.permissions.forEach(permission => {
        permission.permissionSets.forEach(permissionSet => {
          new CfnAssignment(
            this,
            `${permissionSet.name}-${accountId}-${permission.group.name}-Assignment`,
            {
              instanceArn: ssoInstanceArn,
              permissionSetArn: permissionSet.attrPermissionSetArn,
              principalId: permission.group.id,
              principalType: 'GROUP',
              targetId: accountId,
              targetType: 'AWS_ACCOUNT',
            },
          );
        });
      });
    });
  }
}

export default SSOAssignments;
