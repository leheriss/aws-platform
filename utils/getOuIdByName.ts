import {
  ListOrganizationalUnitsForParentCommand,
  OrganizationsClient,
} from '@aws-sdk/client-organizations';
import { getRootId } from '.';

// TODO: cache OU list?
export async function getOrganizationUnitIdByName(
  client: OrganizationsClient,
  ouName: string,
): Promise<string | undefined> {
  try {
    const rootId = await getRootId(client);
    let nextToken: string | undefined;
    do {
      const listResponse = await client.send(
        new ListOrganizationalUnitsForParentCommand({
          ParentId: rootId,
          NextToken: nextToken,
        }),
      );
      nextToken = listResponse.NextToken;

      const foundOU = listResponse.OrganizationalUnits?.find(ou => ou.Name === ouName);
      if (foundOU?.Id) {
        return foundOU.Id;
      }
    } while (nextToken);

    return undefined; // Return null if OU not found
  } catch (error) {
    console.error('Error in getOrganizationUnitIdByName:', error);
    throw error;
  }
}
