import { MoveAccountCommand, OrganizationsClient } from '@aws-sdk/client-organizations';
import { getOrganizationUnitIdByName } from './getOuIdByName';

export const moveAccount = async (
  organizationsClient: OrganizationsClient,
  accountId: string,
  destinationOrganizationId: string,
  sourceOrganizationId: string,
): Promise<void> => {
  const command = new MoveAccountCommand({
    AccountId: accountId,
    DestinationParentId: destinationOrganizationId,
    SourceParentId: sourceOrganizationId,
  });
  try {
    await organizationsClient.send(command);
  } catch (e) {
    const error = e as Error;
    if (error.name !== 'DuplicateAccountException') {
      throw error;
    }
  }
};

export const moveToGivenOuName = async (
  organizationsClient: OrganizationsClient,
  ouName: string,
  accountId: string,
  sourceOuId: string,
) => {
  const ouId = await getOrganizationUnitIdByName(organizationsClient, ouName);
  return ouId
    ? moveAccount(organizationsClient, accountId, ouId, sourceOuId)
    : Promise.reject(
        new Error(`Couldn't move account to ${ouName} OU, check your OU name for typos`),
      );
};
