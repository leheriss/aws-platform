import { CfnBudget, CfnBudgetProps } from 'aws-cdk-lib/aws-budgets';
import { Construct } from 'constructs';

export type BudgetProps = Omit<CfnBudgetProps, 'budget'> &
  Partial<Pick<CfnBudgetProps, 'budget'>> & {
    limitAmountUSD: number;
    emails: string[];
    name?: string;
    costFilters?: {
      Service?: string[];
      AZ?: string[];
      LinkedAccount?: string[];
    };
  };

export class Budget extends CfnBudget {
  constructor(scope: Construct, id: string, props: BudgetProps) {
    super(scope, `${id}-Budget`, {
      budget: {
        budgetType: 'COST',
        timeUnit: 'MONTHLY',

        // the properties below are optional
        budgetLimit: {
          amount: props.limitAmountUSD,
          unit: 'USD',
        },
        budgetName: props.name ? props.name : id,
        costFilters: props.costFilters,
        costTypes: {
          includeCredit: false,
          includeDiscount: false,
          includeOtherSubscription: false,
          includeRecurring: false,
          includeRefund: false,
          includeSubscription: false,
          includeSupport: false,
          includeTax: false,
          includeUpfront: false,
          useAmortized: false,
          useBlended: false,
        },
      },

      notificationsWithSubscribers: [
        {
          notification: {
            comparisonOperator: 'GREATER_THAN',
            notificationType: 'ACTUAL',
            threshold: 75,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: props.emails.map((email: string) => ({
            address: email,
            subscriptionType: 'EMAIL',
          })),
        },
        {
          notification: {
            comparisonOperator: 'GREATER_THAN',
            notificationType: 'ACTUAL',
            threshold: 99,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: props.emails.map((email: string) => ({
            address: email,
            subscriptionType: 'EMAIL',
          })),
        },
        {
          notification: {
            comparisonOperator: 'GREATER_THAN',
            notificationType: 'FORECASTED',
            threshold: 100,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: props.emails.map((email: string) => ({
            address: email,
            subscriptionType: 'EMAIL',
          })),
        },
      ],
    });
  }
}
