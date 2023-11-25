import { Effect } from "aws-cdk-lib/aws-iam";

export type InlinePolicy = {
  Version: string;
  Statement: Statement[];
};

export type Statement = {
  Sid: string;
  Effect: Effect;
  Action?: string[] | string;
  Resource: string[] | string;
  NotAction?: string[];
  Condition?: { [key: string]: { [key: string]: string[] | string } };
};
