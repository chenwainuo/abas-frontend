import create, { State } from 'zustand'
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import {BN, Program} from "@project-serum/anchor";
import {Butler} from "../models/butler";
import {Wallet} from "@solana/wallet-adapter-react";
import {
  BUTLER_PROGRAM_KEY,
  DRIFT_PROGRAM_KEY,
  MANGO_GROUP_CONFIG_KEY,
  MANGO_PROGRAM_KEY,
  MANGO_USDC_ROOT_KEY
} from "../models/constants";
import {MangoAccount, MangoClient, MangoGroup, PerpMarket} from "@blockworks-foundation/mango-client";
import {ClearingHouse, ClearingHouseUser} from "@drift-labs/sdk";
import {PositionUiRow, UserConfigType} from "../models/types";

interface UserSOLBalanceStore extends State {
  balance: number;
  butlerProgram: Program<Butler>;
  getUserSOLBalance: (publicKey: PublicKey, connection: Connection) => void
  getButlerProgram: (connection: Connection, wallet: Wallet) => void
  mangoAccount: PublicKey,
  butlerAccountOwner: PublicKey,
  accountInitialized: boolean,
  positionUi: Array<PositionUiRow>,
  userConfig: UserConfigType
}

// @ts-ignore
const useUserSOLBalanceStore = create<UserSOLBalanceStore>((set, _get) => {
  return {
    balance: 0,

    getUserSOLBalance: async (publicKey, connection) => {
      let balance = 0;
      try {
        balance = await connection.getBalance(
            publicKey,
            'confirmed'
        );
        balance = balance / LAMPORTS_PER_SOL;
      } catch (e) {
        console.log(`error getting balance: `, e);
      }
      set((s) => {
        s.balance = balance;
        console.log(`balance updated, `, balance);
      })
    },
  };
});

export default useUserSOLBalanceStore;
