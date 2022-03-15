import { FC } from 'react';

import { QueryResult } from '@apollo/client/react/types/types';
import { PublicKey } from '@solana/web3.js';

export type AccountValueGraphProps = {
  publicKey: PublicKey;
  queryResult: QueryResult;
};

export const AccountValueGraph: FC<AccountValueGraphProps> = (
  props: AccountValueGraphProps
) => {
  const { loading, error, data } = props.queryResult;

  if (loading) return <p></p>;
  if (error) return <p></p>;
  const { length } = data.user_account_values_30m;

  if (length === 0) {
    return <p></p>;
  }

  console.log(data.user_account_values_30m.map((p) => p._column_));
  return (
    <p>
      {' '}
      Account Value: $
      {data.user_account_values_30m[length - 1]._column_.toFixed(2)}{' '}
    </p>
  );
};
