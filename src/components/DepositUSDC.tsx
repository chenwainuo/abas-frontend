import { FC, useCallback } from 'react';

import { ClearingHouse } from '@drift-labs/sdk';
import { Program } from '@project-serum/anchor';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, TransactionSignature } from '@solana/web3.js';

import { Butler } from '../models/butler';
import {
  BUTLER_PROGRAM_KEY,
  DRIFT_PROGRAM_KEY,
  DRIFT_STATE_KEY,
  MANGO_CACHE_KEY,
  MANGO_GROUP_CONFIG_KEY,
  MANGO_PROGRAM_KEY,
  MANGO_USDC_NODE_KEY,
  MANGO_USDC_ROOT_KEY,
  MANGO_USDC_VAULT,
  USDC_MINT_KEY,
} from '../models/constants';
import { notify } from '../utils/notifications';

export type DepositUSDCProps = {
  show: boolean;
  mangoAccount: PublicKey;
  butlerAccountOwner: PublicKey;
};

export const DepositUSDC: FC<DepositUSDCProps> = (props) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, wallet } = useWallet();

  const onClick = useCallback(async () => {
    if (!publicKey) {
      notify({ type: 'error', message: `Wallet not connected!` });
      console.log('error', `Send Transaction: Wallet not connected!`);
      return;
    }
    const anchor = require('@project-serum/anchor');

    const [accountOwner, accountOwnerBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from(
            anchor.utils.bytes.utf8.encode('butler_account_owner_v1')
          ),
          publicKey.toBuffer(),
        ],
        BUTLER_PROGRAM_KEY
      );

    const [mangoAccountPk, mangoAccountBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from(anchor.utils.bytes.utf8.encode('mango_account_v1')),
          publicKey.toBuffer(),
        ],
        BUTLER_PROGRAM_KEY
      );

    const [state, stateBump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode('state_v1'))],
      BUTLER_PROGRAM_KEY
    );
    const [userConfig, userConfigBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from(anchor.utils.bytes.utf8.encode('butler_user_config_v1')),
          publicKey.toBuffer(),
        ],
        BUTLER_PROGRAM_KEY
      );

    const [driftAccountPk, driftAccountBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from(anchor.utils.bytes.utf8.encode('user')),
          accountOwner.toBuffer(),
        ],
        DRIFT_PROGRAM_KEY
      );

    const [butlerDriftCollateralVault, butlerDriftCollateralBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from(
            anchor.utils.bytes.utf8.encode('butler_drift_collateral_vault_v1')
          ),
          publicKey.toBuffer(),
        ],
        BUTLER_PROGRAM_KEY
      );

    const [butlerMangoCollateralVault, butlerMangoCollateralBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from(
            anchor.utils.bytes.utf8.encode('butler_mango_collateral_vault_v1')
          ),
          publicKey.toBuffer(),
        ],
        BUTLER_PROGRAM_KEY
      );

    const [clearingHouseCollateralVault, _bump] =
      await PublicKey.findProgramAddress(
        [Buffer.from(anchor.utils.bytes.utf8.encode('collateral_vault'))],
        DRIFT_PROGRAM_KEY
      );
    const clearingHouse = ClearingHouse.from(
      connection,
      null,
      DRIFT_PROGRAM_KEY
    );
    await clearingHouse.subscribe();

    const clearingHouseState = clearingHouse.getStateAccount();
    const driftUserData = await clearingHouse.program.account.user.fetch(
      driftAccountPk.toString()
    );
    const clearingHouseUserPositions = driftUserData.positions;
    console.log('positions', clearingHouseUserPositions.toString());

    const provider = new anchor.Provider(connection, wallet);

    const program = (await anchor.Program.at(
      BUTLER_PROGRAM_KEY,
      provider
    )) as Program<Butler>;

    const quantityNative = new anchor.BN((100 / 2) * 1000000);

    const userUsdcAtaAccount = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      USDC_MINT_KEY,
      publicKey
    );

    let signature: TransactionSignature = '';
    try {
      const depositUsdcIx = await program.instruction.depositCollateral(
        stateBump,
        accountOwnerBump,
        butlerDriftCollateralBump,
        butlerMangoCollateralBump,
        userConfigBump,
        quantityNative,
        false,
        {
          accounts: {
            state,
            userConfig,
            userUsdcAtaAccount,
            butlerDriftCollateralVault,
            butlerMangoCollateralVault,
            butlerAccountOwner: accountOwner,
            clearingHouseState: DRIFT_STATE_KEY,
            clearingHouseUser: driftAccountPk,
            clearingHouseCollateralVault,
            clearingHouseUserPositions,
            clearingHouseFundingPaymentHistory:
              clearingHouseState.fundingPaymentHistory,
            clearingHouseDepositHistory: clearingHouseState.depositHistory,
            clearingHouseMarkets: clearingHouseState.markets,
            clearingHouseProgram: clearingHouse.program.programId,
            signer: publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          },
        }
      );
      const depositMangoUsdcIx =
        await program.instruction.depositMangoCollateral(
          stateBump,
          mangoAccountBump,
          accountOwnerBump,
          butlerMangoCollateralBump,
          butlerDriftCollateralBump,
          userConfigBump,
          quantityNative,
          false,
          {
            accounts: {
              state,
              userConfig,
              userUsdcAtaAccount,
              butlerDriftCollateralVault,
              butlerMangoCollateralVault,
              butlerAccountOwner: accountOwner,
              mangoProgram: MANGO_PROGRAM_KEY,
              mangoGroupAi: MANGO_GROUP_CONFIG_KEY,
              mangoAccountPk,
              mangoCacheAi: MANGO_CACHE_KEY,
              rootBankAi: MANGO_USDC_ROOT_KEY,
              nodeBankAi: MANGO_USDC_NODE_KEY,
              vaultAi: MANGO_USDC_VAULT,
              signer: publicKey,
              tokenProgram: TOKEN_PROGRAM_ID,
            },
          }
        );

      signature = await sendTransaction(
        new Transaction().add(depositUsdcIx).add(depositMangoUsdcIx),
        connection
      );

      console.log('signature', signature);
      await connection.confirmTransaction(signature, 'confirmed');
      notify({
        type: 'success',
        message: 'Transaction successful!',
        txid: signature,
      });
    } catch (error: any) {
      notify({
        type: 'error',
        message: `Transaction failed!`,
        description: error?.message,
        txid: signature,
      });
      console.log('error', `Transaction failed! ${error?.message}`, signature);
    } finally {
      await clearingHouse.unsubscribe();
    }
  }, [wallet, publicKey, connection, sendTransaction]);

  if (!props.show || !props.butlerAccountOwner || !props.mangoAccount) {
    return <div></div>;
  }
  return (
    <div>
      <button
        className="btn m-2 bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500"
        onClick={onClick}
        disabled={!publicKey}
      >
        <span> Deposit 100 USDC </span>
      </button>
    </div>
  );
};
