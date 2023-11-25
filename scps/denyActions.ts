import { Effect } from "aws-cdk-lib/aws-iam";

import { ServiceControlPolicy } from "../types/scp";

export const policy: ServiceControlPolicy = {
  Version: "2012-10-17",
  Statement: [
    {
      Sid: "DenyCreateIAMUser",
      Action: ["iam:CreateUser", "iam:CreateAccessKey"],
      Resource: "*",
      Effect: Effect.DENY,
      Condition: {
        StringNotLike: {
          "aws:PrincipalARN": [
            "arn:aws:sts::*:assumed-role/AWSReservedSSO_Admin*",
          ],
        },
      },
    },
    {
      Sid: "DenyDeleteOrganizationRole",
      Effect: Effect.DENY,
      Action: [
        "iam:DeleteRole*",
        "iam:PutRole*",
        "iam:UpdateRole*",
        "iam:DetachRole*",
        "iam:AttachRole*",
      ],
      Resource: ["arn:aws:iam::*:role/OrganizationAccountAccessRole"],
    },
    {
      Sid: "DenyDeleteVpcFlowLogs",
      Effect: Effect.DENY,
      Action: [
        "ec2:DeleteFlowLogs",
        "logs:DeleteLogGroup",
        "logs:DeleteLogStream",
      ],
      Resource: "*",
    },
    {
      Sid: "DenyDeleteCloudTrail",
      Action: ["cloudtrail:StopLogging", "cloudtrail:DeleteTrail"],
      Resource: "*",
      Effect: Effect.DENY,
      Condition: {
        StringNotLike: {
          "aws:PrincipalARN": [
            "arn:aws:sts::*:assumed-role/AWSReservedSSO_Admin*",
          ],
        },
      },
    },
  ],
};
