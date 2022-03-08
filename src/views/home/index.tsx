import { FC } from 'react';

import { useWallet } from '@solana/wallet-adapter-react';

import { useUserInfoContext } from '@/contexts/UserInfoProvider';

import { AccountTable } from '../../components/AccountTable';
import { CreateButlerAccount } from '../../components/CreateButlerAccount';
import { DepositUSDC } from '../../components/DepositUSDC';
import { WithdrawUSDC } from '../../components/WithdrawUSDC';

export const HomeView: FC = () => {
  const wallet = useWallet();

  // const [refresh, setRefresh] = useState("");

  const { data, isLoading, isError, isWalletConnected } = useUserInfoContext();
  if (!isWalletConnected) {
    return <div />;
  }

  if (isLoading || isError) {
    return <div> Loading.... </div>;
  }

  console.log(data);

  return (
    <div className="hero mx-auto p-4 min-h-16 py-4">
      <div className="hero-content flex flex-col max-w-lg">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#9945FF] to-[#14F195]">
          Abas
        </h1>
        <div className="p-2 text-center">
          {data.accountInitialized ? (
            <>
              {!isLoading ? (
                <p>
                  {' '}
                  Total Account Value: $
                  {(data.driftAccountValue + data.mangoAccountValue).toFixed(2)}
                </p>
              ) : null}
              <a
                target="_blank"
                href={`https://app.drift.trade/AVAX?authority=${data.butlerAccountOwner.toString()}`}
                rel="noreferrer"
              >
                <button className="btn m-2 bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ...">
                  Drift Account
                </button>
              </a>
              <a
                target="_blank"
                href={`https://trade.mango.markets/account?pubkey=${data.mangoAccount.toString()}`}
                rel="noreferrer"
              >
                <button className="btn m-2 bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ...">
                  Mango Account
                </button>
              </a>
              <DepositUSDC
                {...{
                  mangoAccount: data.mangoAccount,
                  butlerAccountOwner: data.butlerAccountOwner,
                  show: data.accountInitialized,
                }}
              />
              <WithdrawUSDC
                {...{
                  mangoAccount: data.mangoAccount,
                  butlerAccountOwner: data.butlerAccountOwner,
                  show: data.accountInitialized,
                }}
              />
              <AccountTable
                {...{
                  mangoAccount: data.mangoAccount,
                  butlerAccountOwner: data.butlerAccountOwner,
                  show: data.accountInitialized,
                  rows: data.positionUi,
                }}
              />
            </>
          ) : (
            <CreateButlerAccount publicKey={wallet.publicKey} />
          )}
        </div>
      </div>
    </div>
  );
};
