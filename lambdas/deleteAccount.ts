import { OrganizationsClient, paginateListParents } from '@aws-sdk/client-organizations';
import { Handler } from 'aws-lambda';
import { Logger } from 'tslog';

import { AccountType } from './enums';
import { deleteAccount, moveToGivenOuName } from '../utils';

type DeleteAccountEvent = {
  accountId: string;
};

const log = new Logger();

const getAccountOrganizationUnitId = async (
  organizationsClient: OrganizationsClient,
  accountId: string,
): Promise<string> => {
  const paginator = paginateListParents(
    {
      client: organizationsClient,
    },
    {
      ChildId: accountId,
    },
  );
  const parents = [];
  for await (const page of paginator) {
    if (page.Parents) {
      parents.push(...page.Parents);
    }
  }
  if (!parents[0].Id) {
    throw new Error('No OU parent found');
  }

  return parents[0].Id;
};

export const handler: Handler = async (event: DeleteAccountEvent) => {
  log.info(JSON.stringify(event));

  const { accountId } = event;

  if (!accountId) {
    throw new Error('Missing accountId');
  }

  const organizationsClient = new OrganizationsClient({});

  const sourceOuId = await getAccountOrganizationUnitId(organizationsClient, accountId);

  await moveToGivenOuName(organizationsClient, AccountType.PENDING_DELETION, accountId, sourceOuId);

  try {
    await deleteAccount(organizationsClient, accountId);
  } catch (e) {
    const error = e as Error;
    if (error.name == 'ConstraintViolationException') {
      log.error('Cannot delete account, Account has been moved to Pending Deletion Ou:', error);
    } else {
      throw e;
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify(accountId),
  };
};
