import { Statement } from ".";

export type ServiceControlPolicy = {
  Version: string;
  Statement: Statement[];
};
