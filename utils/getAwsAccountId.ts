import { CfnAccount } from 'aws-cdk-lib/aws-organizations';

export function getAwsAccountId(input: string | CfnAccount): string {
  if (typeof input === 'string') {
    // Check if input is a 12-digit AWS account ID
    if (/^\d{12}$/.test(input)) {
      return input;
    } else {
      throw new Error('Invalid input. Expected 12-digit AWS account ID.');
    }
  }

  return input.attrAccountId;
}
