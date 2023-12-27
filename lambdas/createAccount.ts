/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-misused-promises */
import {
  OrganizationsClient,
  CreateAccountCommand,
  CreateAccountState,
  DescribeCreateAccountStatusCommand,
} from '@aws-sdk/client-organizations';
import { Handler } from 'aws-lambda';
import { Logger } from 'tslog';

import { AccountType } from './enums';
import { getOrganizationUnitIdByName, getRootId, moveAccount, moveToGivenOuName } from '../utils';

type CreateAccountEvent = {
  name: string;
  email: string;
  accountType: AccountType;
  ouName?: string;
};

const log = new Logger();

const createAccount = async (
  organizationsClient: OrganizationsClient,
  email: string,
  name: string,
): Promise<string> => {
  const command = new CreateAccountCommand({
    AccountName: name,
    Email: email,
  });
  const response = await organizationsClient.send(command);

  if (!response.CreateAccountStatus?.Id) {
    throw new Error(`Error while creating account for ${email}`);
  }

  return response.CreateAccountStatus.Id;
};

const waitForAccountCreation = async (
  organizationsClient: OrganizationsClient,
  createAccountRequestId: string,
): Promise<string> =>
  new Promise((resolve, reject) => {
    const poll = async (): Promise<void> => {
      const command = new DescribeCreateAccountStatusCommand({
        CreateAccountRequestId: createAccountRequestId,
      });
      const result = await organizationsClient.send(command);
      if (!result.CreateAccountStatus) {
        return reject(new Error(`No CreateAccountStatus for ${createAccountRequestId}`));
      }
      const createAccountStatus = result.CreateAccountStatus;

      log.info(`STATUS: ${createAccountStatus.State}`);

      const { State, AccountId } = createAccountStatus;

      switch (State) {
        case CreateAccountState.SUCCEEDED:
          AccountId
            ? resolve(AccountId)
            : reject(new Error('Unable to create Account, AccountId undefined'));
          break;

        case CreateAccountState.IN_PROGRESS:
          log.info('Account Creation IN_PROGRESS');
          setTimeout(poll, 5000);
          break;

        default:
          reject(new Error('Unable to create account'));
          break;
      }
    };
    poll();
  });

const getAppAccountOuId = async (client: OrganizationsClient, ouName: string): Promise<string> => {
  const ouId = await getOrganizationUnitIdByName(client, ouName);
  if (!ouId) {
    throw new Error('Wrong Applicative OU Name provided');
  }
  return ouId;
};

export const handler: Handler = async (event: CreateAccountEvent) => {
  log.info(JSON.stringify(event));

  const { email, name, accountType } = event;

  if (!accountType) {
    throw new Error('Missing account type which can be SANDBOX, APP or PLATFORM');
  }

  if (!email || !name) {
    throw new Error('Missing account name and/or email');
  }

  if (event.accountType === AccountType.APP) {
    if (!event.ouName) {
      throw new Error('Cannot create Applicative account without ouName');
    }
  }

  const organizationsClient = new OrganizationsClient({});
  const rootOuId = await getRootId(organizationsClient);

  // If the account is of AccountType.APP type, we must first check if the OU from event exists.
  const ouIdForApp =
    event.accountType === AccountType.APP && event.ouName
      ? await getAppAccountOuId(organizationsClient, event.ouName)
      : null;

  const createAccountRequestId = await createAccount(organizationsClient, email, name);
  const accountId = await waitForAccountCreation(organizationsClient, createAccountRequestId);
  log.info(`Account ${accountId} successfully created ✅`);

  switch (accountType) {
    case AccountType.SANDBOX:
      await moveToGivenOuName(organizationsClient, AccountType.SANDBOX, accountId, rootOuId);
      break;
    case AccountType.APP:
      ouIdForApp
        ? await moveAccount(organizationsClient, accountId, ouIdForApp, rootOuId)
        : Promise.reject(new Error('No Ou Id found to move account to'));
      break;
    case AccountType.PLATFORM:
      // Platform accounts can remain at the root of the AWS Organization
      break;
    default:
      log.info('Account type not known, letting the account at the root organization level');
  }

  return {
    statusCode: 200,
    body: JSON.stringify(accountId),
  };
};
