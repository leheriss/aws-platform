import { ListAccountsForParentCommand, OrganizationsClient } from '@aws-sdk/client-organizations';
import { Handler } from 'aws-lambda';
import { deleteAccount } from '../utils';
import { Logger } from 'tslog';

const log = new Logger();

type DeletePendingDeletionAccountsEvent = {
  pendingDeletionOuId: string;
};

export const handler: Handler = async (event: DeletePendingDeletionAccountsEvent) => {
  const client = new OrganizationsClient({});

  try {
    const accounts = await client.send(
      new ListAccountsForParentCommand({
        ParentId: event.pendingDeletionOuId,
      }),
    );

    for (const account of accounts.Accounts ?? []) {
      if (account.Status === 'ACTIVE') {
        try {
          account.Id
            ? await deleteAccount(client, account.Id)
            : Promise.reject(
                new Error('Error trying to execute deleteAccount call: No account Id found'),
              );
          log.info(`Account deletion requested for account ID: ${account.Id}`);
        } catch (error) {
          const e = error as Error;
          if (e.name == 'ConstraintViolationException') {
            log.error(`Error deleting account ID ${account.Id}:`, error);
          } else {
            throw e;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in processing accounts for deletion:', error);
    throw error;
  }
};
