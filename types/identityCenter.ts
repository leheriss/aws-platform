import { CfnAccount } from 'aws-cdk-lib/aws-organizations';
import { SSOPermissionSet } from '../constructs/ssoPermissionSet';
import { IdentityCenterGroup } from '../constructs/identityCenterGroup';

export interface PermissionSet {
  name: string;
  description?: string;
  managedPolicies?: string[];
  inlinePolicy?: string;
  duration: string;
}

export interface Permission {
  permissionSets: SSOPermissionSet[];
  group: IdentityCenterGroup;
}

export interface Assignment {
  account: string | CfnAccount;
  permissions: Permission[];
}

export interface IdentityCenterConfig {
  groups: Group[];
  permissionSets: PermissionSet[];
  assignments: AssignmentConfig[];
}

export interface AssignmentConfig {
  accountId: string;
  permissions: PermissionConfig[];
}

export interface PermissionConfig {
  groupName: string;
  permissionSets: string[];
}

export interface Group {
  name: string;
}
