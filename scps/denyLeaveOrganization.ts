import { Effect } from "aws-cdk-lib/aws-iam";

import { ServiceControlPolicy } from "../types/scp";

export const policy: ServiceControlPolicy = {
  Version: "2012-10-17",
  Statement: [
    {
      Sid: "DenyLeaveOrganization",
      Action: ["organizations:LeaveOrganization"],
      Resource: "*",
      Effect: Effect.DENY,
    },
  ],
};
