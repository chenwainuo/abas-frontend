import { FC, useCallback } from 'react';

import { ClearingHouse, getUserOrdersAccountPublicKey } from '@drift-labs/sdk';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionSignature,
} from '@solana/web3.js';

import {
  BUTLER_PROGRAM_KEY,
  DRIFT_PROGRAM_KEY,
  RPC_URL,
} from '../models/constants';
import { notify } from '../utils/notifications';

export type DepositUSDCProps = {
  show: boolean;
  mangoAccount: PublicKey;
  butlerAccountOwner: PublicKey;
};

export const InitializeOrderHistory: FC<DepositUSDCProps> = (props) => {
  const connection = new Connection(RPC_URL);
  const wallet = useWallet();
  const { publicKey } = wallet;
  const { sendTransaction } = wallet;

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
      wallet,
      DRIFT_PROGRAM_KEY
    );
    await clearingHouse.subscribe();
    const driftUserData = await clearingHouse.program.account.user.fetch(
      driftAccountPk.toString()
    );
    const clearingHouseUserPositions = driftUserData.positions;
    console.log('positions', clearingHouseUserPositions.toString());

    let signature: TransactionSignature = '';
    try {
      const clearingHouseUserPositionsKey = await getUserOrdersAccountPublicKey(
        DRIFT_PROGRAM_KEY,
        driftAccountPk
      );
      const initializeUserOrderIx =
        await clearingHouse.getInitializeUserOrdersInstruction(
          clearingHouseUserPositionsKey
        );
      console.log(
        'clearingHouseUserPositionsKey',
        clearingHouseUserPositionsKey.toString()
      );
      console.log('initializeUserOrderIx', initializeUserOrderIx);

      signature = await sendTransaction(
        new Transaction().add(initializeUserOrderIx),
        connection,
        { skipPreflight: true }
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
  }, [publicKey, notify, connection, sendTransaction]);

  if (!props.show || !props.butlerAccountOwner || !props.mangoAccount) {
    return <div></div>;
  }
  return (
    <div>
      <button
        className="btn m-2 bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ..."
        onClick={onClick}
        disabled={!publicKey}
      >
        <span> Initialize Order History </span>
      </button>
    </div>
  );
};
