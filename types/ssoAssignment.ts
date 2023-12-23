import { AccountPermissionSet } from '.';

export type Assignment = {
  groupId: string;
  groupName: string;
  accountPermissionSets: AccountPermissionSet[];
};
