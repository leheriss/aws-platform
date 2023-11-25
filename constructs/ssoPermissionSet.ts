import { CfnPermissionSet, CfnPermissionSetProps } from 'aws-cdk-lib/aws-sso';
import { Construct } from 'constructs';

export type SSOPermissionSetProps = Omit<CfnPermissionSetProps, 'name'> &
  Partial<Pick<CfnPermissionSetProps, 'name'>>;

export class SSOPermissionSet extends CfnPermissionSet {
  constructor(scope: Construct, id: string, { instanceArn, ...props }: SSOPermissionSetProps) {
    super(scope, `${id}-PermissionSet`, {
      instanceArn,
      name: id,
      sessionDuration: 'PT12H',
      ...props,
    });
  }
}
