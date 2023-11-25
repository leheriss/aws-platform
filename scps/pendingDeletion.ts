import { Effect } from "aws-cdk-lib/aws-iam";

import { ServiceControlPolicy } from "../types/scp";

export const policy: ServiceControlPolicy = {
  Version: "2012-10-17",
  Statement: [
    {
      Sid: "DenyEverything",
      Effect: Effect.DENY,
      Action: "*",
      Resource: ["*"],
    },
    {
      Sid: "AllowOnlyActionsToDeleteAccount",
      Effect: Effect.ALLOW,
      Action: [
        "aws-portal:ModifyAccount",
        "aws-portal:View*",
        "organizations:CloseAccount",
      ],
      Resource: ["*"],
    },
  ],
};
