import { FC } from 'react';

import { gql, useQuery } from '@apollo/client';
import { PublicKey } from '@solana/web3.js';

import { AccountFundingGraph } from '@/components/AccountFundingGraph';
import { AccountValueGraph } from '@/components/AccountValueGraph';
import { UserConfigType } from '@/models/types';

export type AccountDashboardProps = {
  publicKey: PublicKey;
  userConfig: UserConfigType;
};

const USER_FUNDING_RATES_REVENUE_1D = gql`
  query UserFundingRatesRevenue1d($user_pk: String) {
    user_funding_rates_revenue_1d(
      where: { user_pk: { _eq: $user_pk } }
      order_by: { one_day: asc }
    ) {
      sum
      one_day
    }
  }
`;

const ACCOUNT_VALUE_30M = gql`
  query UserAccountValue30mQuery($user_pk: String) {
    user_account_values_30m(
      where: { user_pk: { _eq: $user_pk } }
      order_by: { thirty_min: asc }
    ) {
      _column_
      thirty_min
    }
  }
`;

export const AccountDashboard: FC<AccountDashboardProps> = (
  props: AccountDashboardProps
) => {
  const fundingRatesQueryResult = useQuery(USER_FUNDING_RATES_REVENUE_1D, {
    variables: { user_pk: props.publicKey },
  });

  const accountValueQueryResult = useQuery(ACCOUNT_VALUE_30M, {
    variables: { user_pk: props.publicKey },
  });

  return (
    <div>
      <AccountValueGraph
        publicKey={props.publicKey}
        queryResult={accountValueQueryResult}
      />
      <AccountFundingGraph
        publicKey={props.publicKey}
        queryResult={fundingRatesQueryResult}
      />
      <p>User total deposited ${props.userConfig.totalDeposited}</p>
    </div>
  );
};
