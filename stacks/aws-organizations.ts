import {
  CfnOrganizationalUnit,
  CfnPolicy,
} from "aws-cdk-lib/aws-organizations";
import { Construct } from "constructs";

import { policy as denyActions } from "../scps/denyActions";
import { policy as denyLeaveOrganization } from "../scps/denyLeaveOrganization";
import { policy as pendingDeletion } from "../scps/pendingDeletion";
import { BaseStack } from "../constructs/baseStack";
import { StackProps } from "aws-cdk-lib";

type OrganizationUnitsProps = {
  accountId: string;
  rootOrganizationId: string;
} & StackProps;

export class AwsOrganizationsStack extends BaseStack {
  public readonly sandboxOu: CfnOrganizationalUnit;

  public readonly pendingDeletionOu: CfnOrganizationalUnit;

  constructor(scope: Construct, id: string, props: OrganizationUnitsProps) {
    super(scope, id, props);

    const { rootOrganizationId } = props;

    this.sandboxOu = new CfnOrganizationalUnit(this, "Sandbox", {
      name: "Sandbox",
      parentId: rootOrganizationId,
    });

    this.pendingDeletionOu = new CfnOrganizationalUnit(
      this,
      "PendingDeletion",
      {
        name: "Pending Deletion",
        parentId: rootOrganizationId,
      }
    );

    new CfnPolicy(this, "DenyLeaveOrganizationSCP", {
      content: denyLeaveOrganization,
      name: "DenyLeaveOrganization",
      type: "SERVICE_CONTROL_POLICY",
      description: "Policy forbidding leaving the Organization",
      targetIds: [rootOrganizationId],
    });

    new CfnPolicy(this, "PendingDeletionSCP", {
      content: pendingDeletion,
      name: "PendingDeletion",
      type: "SERVICE_CONTROL_POLICY",
      description:
        "Policy denying everything but the actions to close the account",
      targetIds: [this.pendingDeletionOu.attrId],
    });

    new CfnPolicy(this, "DenyActionsSCP", {
      content: denyActions,
      name: "DenyActions",
      type: "SERVICE_CONTROL_POLICY",
      description: "Policy denying specific actions",
      targetIds: [rootOrganizationId],
    });
  }
}
