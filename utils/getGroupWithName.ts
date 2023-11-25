import { Group } from "../types";

class GroupNotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GroupNotFoundException";
  }
}

export const getGroupWithName = (groups: Group[], groupName: string): Group => {
  const group = groups.find((g) => g.name === groupName);
  if (!group) {
    throw new GroupNotFoundException(`Group ${groupName} not found`);
  }

  return group;
};
