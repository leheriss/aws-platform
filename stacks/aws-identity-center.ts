import { StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import SSOAssignments from '../constructs/ssoAssignments';
import { Assignment, Permission, IdentityCenterConfig } from '../types';
import { BaseStack } from './baseStack';
import { SSOPermissionSet } from '../constructs/ssoPermissionSet';
import { IdentityCenterGroup } from '../constructs/identityCenterGroup';
import { getContent, loadYamlConfig } from '../utils';
import * as yup from 'yup';

const groupSchema = yup.object().shape({
  name: yup.string().required(),
});

const permissionSetSchema = yup.object().shape({
  name: yup.string().required(),
  managedPolicies: yup.array().of(yup.string()),
  inlinePolicy: yup.string(),
  description: yup.string(),
  duration: yup.string(),
});

const permissionSchema = yup.object().shape({
  groupName: yup.string().required(),
  permissionSets: yup.array().of(yup.string()).required(),
});

const assignmentSchema = yup.object().shape({
  accountId: yup.string().required(),
  permissions: yup.array().of(permissionSchema).required(),
});

const identityCenterSchema = yup.object().shape({
  groups: yup.array().of(groupSchema).required(),
  permissionSets: yup.array().of(permissionSetSchema).required(),
  assignments: yup.array().of(assignmentSchema).required(),
});

type AwsSsoStackProps = StackProps & {
  accountId: string;
  ssoInstanceArn: string;
  identityStoreId: string;
  configFilePath: string;
};

export class AwsIdentityCenterStack extends BaseStack {
  private readonly groups: IdentityCenterGroup[];

  private readonly permissionSets: SSOPermissionSet[];

  constructor(scope: Construct, id: string, props: AwsSsoStackProps) {
    const { ssoInstanceArn, identityStoreId, configFilePath } = props;
    super(scope, id, {
      ...props,
    });

    const identityCenterConfig: IdentityCenterConfig = loadYamlConfig<IdentityCenterConfig>(
      configFilePath,
      identityCenterSchema,
    );

    const { groups, permissionSets } = identityCenterConfig;

    // GROUPS

    this.groups = groups.map(group => {
      return new IdentityCenterGroup(this, group.name, {
        groupName: group.name,
        identityStoreId,
      });
    });

    // PERMISSION SETS

    this.permissionSets = permissionSets.map(permissionSet => {
      const inlinePolicyContent = permissionSet.inlinePolicy
        ? JSON.parse(getContent(permissionSet.inlinePolicy))
        : undefined;

      return new SSOPermissionSet(this, permissionSet.name, {
        instanceArn: ssoInstanceArn,
        managedPolicies: permissionSet.managedPolicies,
        inlinePolicy: inlinePolicyContent,
        description: permissionSet.description,
        sessionDuration: permissionSet.duration || 'PT12H',
      });
    });

    const assignments: Assignment[] = identityCenterConfig.assignments.map(ass => {
      const permissions: Permission[] = ass.permissions.map(perm => {
        const group = this.groups.find(group => group.name === perm.groupName);
        if (!group) {
          throw new Error(`No SSO Group found for ${perm.groupName}`);
        }
        const permissions = perm.permissionSets.map(permissionSet => {
          const permission = this.permissionSets.find(ps => ps.name === permissionSet);
          if (!permission) {
            throw new Error(`No Permissions found for ${permissionSet}`);
          }
          return permission;
        });
        if (!permissions) {
          throw new Error(`No Permissions found for ${perm.groupName}`);
        }
        return {
          group,
          permissionSets: permissions,
        } as Permission;
      });
      return {
        account: ass.accountId,
        permissions,
      };
    });

    new SSOAssignments(this, 'SSOAssignments', {
      ssoInstanceArn,
      assignments,
    });
  }
}
