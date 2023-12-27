import { CfnOrganizationalUnit, CfnPolicy } from 'aws-cdk-lib/aws-organizations';
import { Construct } from 'constructs';

import { policy as pendingDeletion } from '../scps/pendingDeletion';
import { BaseStack } from './baseStack';
import { StackProps } from 'aws-cdk-lib';
import { getContent, loadYamlConfig } from '../utils';
import { OrganizationalUnit, OrganizationConfig } from '../types';
import * as yup from 'yup';

const organizationUnitSchema = yup.object().shape({
  name: yup.string().required(),
  parentName: yup.string().required(),
});

const serviceControlPolicySchema = yup.object().shape({
  name: yup.string().required(),
  description: yup.string().required(),
  targetOUNames: yup.array().of(yup.string()).required(),
  contentFile: yup.string().required(),
});

const organizationConfigSchema = yup.object().shape({
  organizationUnits: yup.array().of(organizationUnitSchema).required(),
  serviceControlPolicies: yup.array().of(serviceControlPolicySchema).required(),
});

function buildOUTree(ous: OrganizationalUnit[]): Map<string, OrganizationalUnit[]> {
  return ous.reduce((tree, ou) => {
    const children = tree.get(ou.parentName) || [];
    return new Map(tree.set(ou.parentName, [...children, ou]));
  }, new Map<string, OrganizationalUnit[]>());
}

async function createOUsInOrder(
  scope: Construct,
  ouTree: Map<string, OrganizationalUnit[]>,
  parentName: string,
  parentOuId: string,
  createdOUs: CfnOrganizationalUnit[],
) {
  const children = ouTree.get(parentName) || [];
  for (const child of children) {
    // Create the OU using CDK
    const childOu = new CfnOrganizationalUnit(scope, child.name, {
      name: child.name,
      parentId: parentOuId,
    });

    // Store the created OU in the array
    createdOUs.push(childOu);

    // Recursively create child OUs
    await createOUsInOrder(scope, ouTree, child.name, childOu.ref, createdOUs);
  }
}

type OrganizationUnitsProps = {
  accountId: string;
  rootOrganizationId: string;
  configFilePath: string;
} & StackProps;

export class AwsOrganizationsStack extends BaseStack {
  public readonly sandboxOu: CfnOrganizationalUnit;

  public readonly pendingDeletionOu: CfnOrganizationalUnit;

  private readonly organizationUnits: CfnOrganizationalUnit[] = [];

  constructor(scope: Construct, id: string, props: OrganizationUnitsProps) {
    super(scope, id, props);

    const { rootOrganizationId, configFilePath } = props;

    const organizationConfig: OrganizationConfig = loadYamlConfig<OrganizationConfig>(
      configFilePath,
      organizationConfigSchema,
    );

    const { organizationUnits, serviceControlPolicies } = organizationConfig;

    const ouTree = buildOUTree(organizationUnits);

    createOUsInOrder(this, ouTree, 'root', rootOrganizationId, this.organizationUnits);

    serviceControlPolicies.forEach(async scp => {
      const targetOuIds = (
        await Promise.all(
          scp.targetOUNames.map(async ouName => {
            if (ouName === 'root') {
              return rootOrganizationId;
            }
            const ouList = this.organizationUnits.filter(ou => ou.name === ouName);
            const ouIdList = ouList.map(ou => ou.attrId);
            return ouIdList;
          }),
        )
      ).flat();

      const scpContent = getContent(scp.contentFile);

      new CfnPolicy(this, `${scp.name}SCP`, {
        content: JSON.parse(scpContent),
        name: scp.name,
        type: 'SERVICE_CONTROL_POLICY',
        description: scp.description,
        targetIds: targetOuIds,
      });
    });

    // Mandatory Pending Deletion Organization Unit

    this.pendingDeletionOu = new CfnOrganizationalUnit(this, 'PendingDeletion', {
      name: 'Pending Deletion',
      parentId: rootOrganizationId,
    });

    new CfnPolicy(this, 'PendingDeletionSCP', {
      content: pendingDeletion,
      name: 'PendingDeletion',
      type: 'SERVICE_CONTROL_POLICY',
      description: 'Policy denying everything but the actions to close the account',
      targetIds: [this.pendingDeletionOu.attrId],
    });
  }
}
