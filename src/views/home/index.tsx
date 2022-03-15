import { FC } from 'react';

import { useWallet } from '@solana/wallet-adapter-react';

import { AccountDashboard } from '@/components/AccountDashboard';
import { AccountTable } from '@/components/AccountTable';
import { CreateButlerAccount } from '@/components/CreateButlerAccount';
import { DepositModal } from '@/components/DespositModal';
import { WithdrawUSDC } from '@/components/WithdrawUSDC';
import { useUserInfoContext } from '@/contexts/UserInfoProvider';
import { WHITELIST_PUBKEY } from '@/models/constants';

export const HomeView: FC = () => {
  const wallet = useWallet();

  const { data, isLoading, isError, isWalletConnected } = useUserInfoContext();
  if (!isWalletConnected) {
    return <div />;
  }

  if (isLoading || isError) {
    return <div> Loading.... </div>;
  }

  if (
    wallet.publicKey &&
    !WHITELIST_PUBKEY.includes(wallet.publicKey.toString())
  ) {
    return (
      <div>
        <a>
          Abas app is being tested within small group of early users right now
          to make sure everything is working as intended & safe to use.{' '}
          <br></br> We will open up for wider set of users soon.<br></br>{' '}
          Meanwhile swing by our Discord and stay tune =)
        </a>
      </div>
    );
  }

  return (
    <div className="p-4 py-4 mx-auto hero min-h-16">
      <div className="flex flex-col max-w-lg hero-content">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#9945FF] to-[#14F195]">
          Abas
        </h1>
        <div className="p-2 text-center">
          {data.accountInitialized ? (
            <>
              <AccountDashboard publicKey={wallet.publicKey} />
              <a
                target="_blank"
                href={`https://app.drift.trade/AVAX?authority=${data.butlerAccountOwner.toString()}`}
                rel="noreferrer"
              >
                <button className="m-2 bg-gradient-to-r from-[#9945FF] hover:from-pink-500 to-[#14F195] hover:to-yellow-500 btn ...">
                  Drift Account
                </button>
              </a>
              <a
                target="_blank"
                href={`https://trade.mango.markets/account?pubkey=${data.mangoAccount.toString()}`}
                rel="noreferrer"
              >
                <button className="m-2 bg-gradient-to-r from-[#9945FF] hover:from-pink-500 to-[#14F195] hover:to-yellow-500 btn ...">
                  Mango Account
                </button>
              </a>
              <div>
                <DepositModal
                  usdcBalannce={data!.userUsdcBalance}
                  currentColateral={
                    data!.driftAccountValue + data!.mangoAccountValue
                  }
                  depositLimit={data!.depositLimit}
                  mangoAccount={data!.mangoAccount}
                  butlerAccountOwner={data!.butlerAccountOwner}
                />
              </div>
              <WithdrawUSDC
                {...{
                  mangoAccount: data!.mangoAccount,
                  butlerAccountOwner: data!.butlerAccountOwner,
                  show: data!.accountInitialized,
                  driftFreeCollateral: data!.driftFreeCollateral,
                  mangoAccountValue: data!.mangoAccountValue,
                  positionUi: data!.positionUi,
                }}
              />
              <AccountTable
                {...{
                  mangoAccount: data!.mangoAccount,
                  butlerAccountOwner: data!.butlerAccountOwner,
                  show: data!.accountInitialized,
                  rows: data!.positionUi,
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
