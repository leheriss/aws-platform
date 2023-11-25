import { CloseAccountCommand, OrganizationsClient } from '@aws-sdk/client-organizations';

export const deleteAccount = async (organizationsClient: OrganizationsClient, id: string) => {
  const command = new CloseAccountCommand({
    AccountId: id,
  });
  await organizationsClient.send(command);
};
