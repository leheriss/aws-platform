import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';

import * as FinOps from '../stacks/finops';

test('has Global budget', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new FinOps.FinOpsStack(app, 'MyTestStack', {
    adminEmailsParameterName: 'test-parameter',
    accountId: '123456789101',
  });
  // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::Budgets::Budget', {
    Budget: Match.objectEquals({
      BudgetLimit: {
        Amount: Match.anyValue(),
        Unit: 'USD',
      },
      BudgetType: 'COST',
      TimeUnit: 'MONTHLY',
      BudgetName: 'GlobalBudget',
      CostTypes: {
        IncludeCredit: false,
        IncludeDiscount: false,
        IncludeOtherSubscription: false,
        IncludeRecurring: false,
        IncludeRefund: false,
        IncludeSubscription: false,
        IncludeSupport: false,
        IncludeTax: false,
        IncludeUpfront: false,
        UseAmortized: false,
        UseBlended: false,
      },
    }),
  });
});
