import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

type BaseStackProps = StackProps & {
  accountId: string;
};

export class BaseStack extends Stack {
  constructor(scope: Construct, id: string, props: BaseStackProps) {
    const { accountId, env } = props;
    super(scope, id, {
      env: {
        account: accountId,
        region: env?.region ?? 'eu-west-1',
      },
      tags: {
        ENVIRONMENT: 'prod',
      },
      ...props,
    });
  }
}
