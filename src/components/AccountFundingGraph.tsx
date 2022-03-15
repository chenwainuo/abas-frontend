import { FC } from 'react';

import { QueryResult } from '@apollo/client/react/types/types';
import { PublicKey } from '@solana/web3.js';

export type AccountFundingGraphProps = {
  publicKey: PublicKey;
  queryResult: QueryResult;
};

export const AccountFundingGraph: FC<AccountFundingGraphProps> = (
  props: AccountFundingGraphProps
) => {
  const { loading, error, data } = props.queryResult;
  if (loading) return <p></p>;
  if (error) return <p></p>;
  const { length } = data.user_funding_rates_revenue_1d;

  if (length === 0) {
    return <p></p>;
  }

  console.log(data.user_funding_rates_revenue_1d.map((p) => p._column_));
  return (
    <p>
      {' '}
      Past day funding revenue: $
      {data.user_funding_rates_revenue_1d[length - 1].sum.toFixed(2)}{' '}
    </p>
  );
};
