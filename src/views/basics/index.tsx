
import {FC, useEffect} from "react";
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

export const BasicsView: FC = ({ }) => {
  const wallet = useWallet();

  const connection = new Connection(RPC_URL)

  const { getUserSOLBalance, getButlerProgram } = useUserSOLBalanceStore()

  useEffect(() => {
    (async () => {
      if (wallet.publicKey) {
        console.log(wallet.publicKey.toBase58())
        getUserSOLBalance(wallet.publicKey, connection)
        getButlerProgram(connection, wallet.wallet)
      }
    })();
  }, [wallet.publicKey, connection, getUserSOLBalance])


  return (
    <div className="hero mx-auto p-4 min-h-16 py-4">
      <div className="hero-content flex flex-col max-w-lg">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#9945FF] to-[#14F195]">
          Abas
        </h1>
        {/* CONTENT GOES HERE */}
        <div className="p-2 text-center">
        </div>
      </div>
    </div>
  );
};
