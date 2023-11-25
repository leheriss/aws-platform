import { CfnAccount } from "aws-cdk-lib/aws-organizations";
import { CfnPermissionSet } from "aws-cdk-lib/aws-sso";
import { InlinePolicy } from ".";

export type AccountPermissionSet = {
  permissionSet: CfnPermissionSet;
  account: CfnAccount | string;
};

export type PermissionSet = {
  name: string;
  description?: string;
  managedPolicies?: string[];
  inlinePolicy?: InlinePolicy;
  duration: number;
};
