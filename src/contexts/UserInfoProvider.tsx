import { createContext, useContext } from 'react';

import { useWallet } from '@solana/wallet-adapter-react';

import useUserInfo from '@/hooks/userUserInfo';
import { UserInfoData } from '@/pages/api/info/[user]';

export interface UserInfoContextState {
  data?: UserInfoData;
  isLoading?: boolean;
  isError?: boolean;
  isWalletConnected: boolean;
}

const UserInfoContext = createContext<UserInfoContextState>(
  {} as UserInfoContextState
);
export const UserInfoProvider = ({ children }) => {
  const wallet = useWallet();
  const isWalletConnected = wallet.publicKey !== null;
  // if (!isWalletConnected) {
  //   return (
  //     <UserInfoContext.Provider
  //       value={{
  //         isWalletConnected,
  //       }}
  //     >
  //       {children}
  //     </UserInfoContext.Provider>
  //   );
  // }
  const { data, isLoading, isError } = useUserInfo(
    wallet?.publicKey?.toString()
  );

  return (
    <UserInfoContext.Provider
      value={{
        data,
        isError,
        isLoading,
        isWalletConnected,
      }}
    >
      {children}
    </UserInfoContext.Provider>
  );
};
export const useUserInfoContext = () => useContext(UserInfoContext);
