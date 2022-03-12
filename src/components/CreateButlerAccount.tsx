import { FC, useCallback } from 'react';

import { Program } from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  Keypair,
  PublicKey,
  Transaction,
  TransactionSignature,
} from '@solana/web3.js';

import { notify } from '@/utils/notifications';

import { Butler } from '../models/butler';
import {
  BUTLER_PROGRAM_KEY,
  DRIFT_PROGRAM_KEY,
  DRIFT_STATE_KEY,
  MANGO_GROUP_CONFIG_KEY,
  MANGO_PROGRAM_KEY,
  USDC_MINT_KEY,
} from '../models/constants';

export type CreateButlerAccountProps = {
  publicKey?: PublicKey | null;
};

export const CreateButlerAccount: FC<CreateButlerAccountProps> = (props) => {
  const { connection } = useConnection();
  const { sendTransaction, wallet } = useWallet();

  const onClick = useCallback(async () => {
    if (!props.publicKey) {
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
          props.publicKey.toBuffer(),
        ],
        BUTLER_PROGRAM_KEY
      );

    const [mangoAccountPk, mangoAccountBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from(anchor.utils.bytes.utf8.encode('mango_account_v1')),
          props.publicKey.toBuffer(),
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
          props.publicKey.toBuffer(),
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

    const [driftUserOrdersPk, driftUserOrdersNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from(anchor.utils.bytes.utf8.encode('user_orders')),
          driftAccountPk.toBuffer(),
        ],
        DRIFT_PROGRAM_KEY
      );

    const [butlerDriftCollateralVault, butlerDriftCollateralBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from(
            anchor.utils.bytes.utf8.encode('butler_drift_collateral_vault_v1')
          ),
          props.publicKey.toBuffer(),
        ],
        BUTLER_PROGRAM_KEY
      );

    const [butlerMangoCollateralVault, butlerMangoCollateralBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from(
            anchor.utils.bytes.utf8.encode('butler_mango_collateral_vault_v1')
          ),
          props.publicKey.toBuffer(),
        ],
        BUTLER_PROGRAM_KEY
      );
    const provider = new anchor.Provider(connection, wallet);

    const program = (await anchor.Program.at(
      BUTLER_PROGRAM_KEY,
      provider
    )) as Program<Butler>;

    const driftUserPositionKeyPair = Keypair.generate();

    let signature: TransactionSignature = '';
    try {
      const createUserAccountIx = program.instruction.createUserAccount(
        stateBump,
        driftAccountBump,
        mangoAccountBump,
        accountOwnerBump,
        butlerDriftCollateralBump,
        butlerMangoCollateralBump,
        {
          accounts: {
            state,
            driftCollateralMint: USDC_MINT_KEY,
            mangoCollateralMint: USDC_MINT_KEY,
            butlerDriftCollateralVault,
            butlerMangoCollateralVault,
            clearingHouseState: DRIFT_STATE_KEY,
            clearingHouseUser: driftAccountPk,
            clearingHouseUserPositions: driftUserPositionKeyPair.publicKey,
            clearingHouseProgram: DRIFT_PROGRAM_KEY,
            mangoProgram: MANGO_PROGRAM_KEY,
            mangoGroupPk: MANGO_GROUP_CONFIG_KEY,
            mangoAccountPk,
            signer: props.publicKey,
            butlerAccountOwner: accountOwner,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          },
          signers: [driftUserPositionKeyPair],
        }
      );

      const createUserConfigIx = program.instruction.createUserConfig(
        stateBump,
        userConfigBump,
        {
          accounts: {
            state,
            userConfig,
            signer: props.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          },
        }
      );

      const createUserOrdersIx = program.instruction.createUserDriftOrders(
        stateBump,
        driftUserOrdersNonce,
        accountOwnerBump,
        {
          accounts: {
            state,
            butlerAccountOwner: accountOwner,
            clearingHouseState: DRIFT_STATE_KEY,
            clearingHouseProgram: DRIFT_PROGRAM_KEY,
            clearingHouseUser: driftAccountPk,
            clearingHouseUserOrders: driftUserOrdersPk,
            signer: props.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          },
        }
      );

      signature = await sendTransaction(
        new Transaction()
          .add(createUserAccountIx)
          .add(createUserConfigIx)
          .add(createUserOrdersIx),
        connection,
        { signers: [driftUserPositionKeyPair] }
      );

      await connection.confirmTransaction(signature, 'confirmed');
      await new Promise((f) => setTimeout(f, 10000));
      console.log('signature', signature);
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
    }
  }, [props.publicKey, notify, connection, sendTransaction]);

  return (
    <div>
      <button
        className="m-2 bg-gradient-to-r from-[#9945FF] hover:from-pink-500 to-[#14F195] hover:to-yellow-500 btn ..."
        onClick={onClick}
        disabled={!props.publicKey}
      >
        <span> Create Abas Account </span>
      </button>
    </div>
  );
};
