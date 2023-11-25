import { Group } from ".";
import { AccountPermissionSet } from ".";

export type Assignment = {
  group: Group;
  accountPermissionSets: AccountPermissionSet[];
};
