import { Stack, StackProps } from 'aws-cdk-lib';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { CfnOrganizationalUnit } from 'aws-cdk-lib/aws-organizations';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

import { LambdaConstruct } from '../constructs/lambda';
import { BaseStack } from './baseStack';

type AccountFactoryProps = {
  accountId: string;
  pendingDeletionOU: CfnOrganizationalUnit;
} & StackProps;

export class AwsAccountFactoryStack extends BaseStack {
  constructor(scope: Construct, id: string, props: AccountFactoryProps) {
    super(scope, id, props);

    const { pendingDeletionOU } = props;

    const { stackName } = Stack.of(this);

    const createAccountLambda = new LambdaConstruct(this, 'CreateAccountLambda', {
      functionName: `${stackName}-create-account`,
      entry: './lambdas/createAccount.ts',
    });

    createAccountLambda.addToRolePolicy(
      new PolicyStatement({
        actions: [
          'organizations:CreateAccount',
          'organizations:MoveAccount',
          'organizations:DescribeCreateAccountStatus',
          'organizations:ListOrganizationalUnitsForParent',
          'organizations:ListRoots',
        ],
        effect: Effect.ALLOW,
        resources: ['*'],
      }),
    );

    createAccountLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ['sso:CreateAccountAssignment'],
        effect: Effect.ALLOW,
        resources: ['*'],
      }),
    );

    const deleteAccountLambda = new LambdaConstruct(this, 'DeleteAccountLambda', {
      functionName: `${stackName}-delete-account`,
      entry: './lambdas/deleteAccount.ts',
      environment: {
        PENDING_DELETION_OU: pendingDeletionOU.attrId,
      },
    });

    deleteAccountLambda.addToRolePolicy(
      new PolicyStatement({
        actions: [
          'organizations:CloseAccount',
          'organizations:MoveAccount',
          'organizations:ListParents',
          'organizations:ListOrganizationalUnitsForParent',
          'organizations:ListRoots',
        ],
        effect: Effect.ALLOW,
        resources: ['*'],
      }),
    );

    const deletePendingDeletionAccountsLambda = new LambdaConstruct(this, 'DeleteAccountLambda', {
      functionName: `${stackName}-delete-pending-deletion-accounts`,
      entry: './lambdas/deletePendingDeletionAccounts.ts',
      environment: {
        PENDING_DELETION_OU: pendingDeletionOU.attrId,
      },
    });

    deletePendingDeletionAccountsLambda.addToRolePolicy(
      new PolicyStatement({
        actions: [
          'organizations:CloseAccount',
          'organizations:ListParents',
          'organizations:ListOrganizationalUnitsForParent',
        ],
        effect: Effect.ALLOW,
        resources: ['*'],
      }),
    );

    const rule = new Rule(this, 'rule', {
      schedule: Schedule.cron({ month: '*', minute: '0', day: '1', hour: '0' }),
    });

    rule.addTarget(new LambdaFunction(deletePendingDeletionAccountsLambda, {}));
  }
}
