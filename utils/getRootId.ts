import { ListRootsCommand, OrganizationsClient } from '@aws-sdk/client-organizations';

export async function getRootId(client: OrganizationsClient): Promise<string> {
  try {
    const command = new ListRootsCommand({});
    const response = await client.send(command);

    // Typically, there's only one root per organization, but it's still returned as an array
    const rootId = response.Roots?.[0]?.Id;
    return rootId ? rootId : Promise.reject(new Error('No Root Organizations Id found'));
  } catch (error) {
    console.error('Error in getRootId:', error);
    throw error;
  }
}
