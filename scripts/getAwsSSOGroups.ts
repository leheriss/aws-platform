#!/usr/bin/env -S npx ts-node

import {
  Group as ssoGroup,
  IdentitystoreClient,
  paginateListGroups,
} from '@aws-sdk/client-identitystore';
import * as dotenv from 'dotenv';

import { Group } from '../types';

dotenv.config();

export const listGroups = async (identityStoreId: string): Promise<Group[]> => {
  const ssoClient = new IdentitystoreClient({});

  const paginator = paginateListGroups(
    {
      client: ssoClient,
    },
    {
      IdentityStoreId: identityStoreId,
    },
  );

  // Functional operations are not permitted with async iterators,
  // hence the `for await ... push` instead of a `map`
  const groups: ssoGroup[] = [];
  for await (const page of paginator) {
    if (page.Groups) {
      groups.push(...page.Groups);
    }
  }

  return groups.map(
    (group: ssoGroup) =>
      ({
        id: group.GroupId,
        name: group.DisplayName,
      }) as Group,
  );
};

if (!process.env.IDENTITY_STORE_ID) {
  throw new Error('Missing IDENTITY_STORE_ID from environment variables');
}

listGroups(process.env.IDENTITY_STORE_ID)
  .then(groups => JSON.stringify(groups))
  .then(groups => {
    // eslint-disable-next-line no-console
    console.log(`ssoGroups=${groups}`);

    return `ssoGroups=${groups}`;
  })
  .catch(error => {
    throw error;
  });
