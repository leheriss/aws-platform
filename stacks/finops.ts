import { StackProps } from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

import { Budget } from '../constructs/budget';
import { BaseStack } from './baseStack';

type FinOpsStackProps = StackProps & {
  accountId: string;
  adminEmailsParameterName: string;
};

export class FinOpsStack extends BaseStack {
  constructor(scope: Construct, id: string, props: FinOpsStackProps) {
    super(scope, id, props);

    const { adminEmailsParameterName } = props;

    const adminEmailsParameter = ssm.StringParameter.valueFromLookup(
      this,
      adminEmailsParameterName,
    );
    const adminEmails = adminEmailsParameter.split(',');

    new Budget(this, 'GlobalBudget', {
      limitAmountUSD: 10,
      emails: adminEmails,
    });
  }
}
