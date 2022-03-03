
import {FC, useEffect, useState} from "react";
import { SignMessage } from '../../components/SignMessage';
import { SendTransaction } from '../../components/SendTransaction';
import {CreateButlerAccount} from "../../components/CreateButlerAccount";
import {useConnection, useWallet} from "@solana/wallet-adapter-react";
import useUserSOLBalanceStore from "../../stores/useUserSOLBalanceStore";
import {DepositUSDC} from "../../components/DepositUSDC";
import {RebalanceCollateral} from "../../components/RebalanceCollateral";
import {AccountTable} from "../../components/AccountTable";
import {UserConfig} from "../../components/UserConfig";
import {Connection} from "@solana/web3.js";
import {RPC_URL} from "../../models/constants";
import {UserInfoData} from "../../pages/api/info/[user]";
import useUserInfo from "../../hooks/userUserInfo";
import {publicKey} from "@solana/web3.js/src/layout";

export const HomeView: FC = ({ }) => {
  const wallet = useWallet();

  // const [refresh, setRefresh] = useState("");

  if (!wallet.publicKey) {
    return <div/>
  }

  const { data, isLoading, isError } = useUserInfo(wallet.publicKey.toString())

  if (isLoading || isError) {
    return <div> Loading.... </div>
  }


  console.log(data)

  return (
      <div className="hero mx-auto p-4 min-h-16 py-4">
        <div className="hero-content flex flex-col max-w-lg">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#9945FF] to-[#14F195]">
            Abas
          </h1>
          {/* CONTENT GOES HERE */}
          <div className="p-2 text-center">
            <p>Total Account Value: ${(data.driftAccountValue + data.mangoAccountValue).toFixed(2)}</p>
            <CreateButlerAccount  show={!data.accountInitialized && !isLoading} publicKey={wallet.publicKey}/>
            <DepositUSDC  {... {mangoAccount: data.mangoAccount, butlerAccountOwner: data.butlerAccountOwner, show: data.accountInitialized}}/>
            <AccountTable {... {mangoAccount: data.mangoAccount, butlerAccountOwner: data.butlerAccountOwner, show: data.accountInitialized, rows:data.positionUi}}/>
          </div>
        </div>
      </div>
  );
}
