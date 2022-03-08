import useSWR from 'swr';

import { UserInfoData } from '../pages/api/info/[user]';

export type UserInfo = {
  data: UserInfoData;
  isLoading: boolean;
  isError: boolean;
};

export default function useUserInfo(publicKey?: string): UserInfo {
  // @ts-ignore
  const fetcher = (...args) => fetch(...args).then((res) => res.json());

  // this call is quite heavy on RPC node as you can imajin
  // auto refresh every 30 seconds to get updated data
  // min call interval is every 10 seconds
  const { data, error } = useSWR(
    publicKey ? `/api/info/${publicKey}` : null,
    fetcher,
    {
      refreshInterval: 30000,
      dedupingInterval: 10000,
      revalidateOnFocus: false,
      errorRetryInterval: 10000,
    }
  );

  return {
    data,
    isLoading: !error && !data,
    isError: error,
  };
}
