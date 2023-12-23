import { CfnAssignment } from 'aws-cdk-lib/aws-sso';
import { Construct } from 'constructs';

import { Assignment } from '../types';

type SSOAssignmentsProps = {
  assignments: Assignment[];
  ssoInstanceArn: string;
};

class SSOAssignments extends Construct {
  constructor(scope: Construct, id: string, props: SSOAssignmentsProps) {
    super(scope, id);

    props.assignments.forEach(assignment => {
      assignment.accountPermissionSets.forEach(accountPermissionSet => {
        const { account } = accountPermissionSet;
        // The account can be either a platform account (CfnAccount) or directly the account Id if the account comes from outside CDK management
        const constructId = typeof account === 'string' ? account : account.node.id;
        new CfnAssignment(
          this,
          `${accountPermissionSet.permissionSet.name}-${constructId}-${assignment.groupName}-Assignment`,
          {
            instanceArn: props.ssoInstanceArn,
            permissionSetArn: accountPermissionSet.permissionSet.attrPermissionSetArn,
            principalId: assignment.groupId,
            principalType: 'GROUP',
            targetId: typeof account === 'string' ? account : account.attrAccountId,
            targetType: 'AWS_ACCOUNT',
          },
        );
      });
    });
  }
}

export default SSOAssignments;
