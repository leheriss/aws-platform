import { Duration } from 'aws-cdk-lib';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export type LambdaConstructProps = Omit<NodejsFunctionProps, 'entry' | 'functionName'> &
  Required<Pick<NodejsFunctionProps, 'entry' | 'functionName'>>;

export class LambdaConstruct extends NodejsFunction {
  constructor(
    scope: Construct,
    id: string,
    { functionName, environment, ...props }: LambdaConstructProps,
  ) {
    super(scope, `${functionName}-lambda`, {
      functionName,
      runtime: Runtime.NODEJS_20_X,
      bundling: {
        target: 'es2020',
        keepNames: true,
        sourceMap: true,
        minify: true,
      },
      handler: 'handler',
      architecture: Architecture.ARM_64,
      memorySize: 1024,
      timeout: Duration.seconds(900),
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        NODE_OPTIONS: '--enable-source-maps',
        ...environment,
      },
      ...props,
    });
  }
}
