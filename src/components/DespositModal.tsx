import React, { useCallback, useMemo, useState } from 'react';

import { ClearingHouse } from '@drift-labs/sdk';
import { Program } from '@project-serum/anchor';
import {
  Token,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, TransactionSignature, Transaction } from '@solana/web3.js';

import Input from '@/components/Input';
import { Butler } from '@/models/butler';
import {
  BUTLER_PROGRAM_KEY,
  DRIFT_PROGRAM_KEY,
  USDC_MINT_KEY,
  DRIFT_STATE_KEY,
  MANGO_PROGRAM_KEY,
  MANGO_GROUP_CONFIG_KEY,
  MANGO_CACHE_KEY,
  MANGO_USDC_ROOT_KEY,
  MANGO_USDC_NODE_KEY,
  MANGO_USDC_VAULT,
} from '@/models/constants';
import { numberToCurrency } from '@/utils/currency';
import { notify } from '@/utils/notifications';

export interface DepositModalProps {
  usdcBalannce: number;
  depositLimit: number;
  currentColateral: number;
  mangoAccount: PublicKey;
  butlerAccountOwner: PublicKey;
}
export const DepositModal = ({
  usdcBalannce,
  depositLimit,
  currentColateral,
  mangoAccount,
  butlerAccountOwner,
}: DepositModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModalOpened, setIsModalOpened] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [totalColateral, setTotalColateral] = useState(currentColateral);
  const [depositOverLimit, setDepositOverLimit] = useState(false);
  const [depositOverWalletTotal, setDepositOverWalletTotal] = useState(false);

  const { connection } = useConnection();
  const { publicKey, sendTransaction, wallet } = useWallet();
  const remainingMaxDeposit = depositLimit - currentColateral;
  const isConfirmDisabled = useCallback(() => {
    return depositAmount === '' || depositOverWalletTotal || depositOverLimit;
  }, [depositAmount, depositOverLimit, depositOverWalletTotal]);

  const inputError = useMemo(() => {
    if (depositOverWalletTotal) {
      return 'Enter an amount less than your wallet balance';
    }
    if (depositOverLimit) {
      return 'Enter an amount less than deposit limit';
    }
    return '';
  }, [depositOverLimit, depositOverWalletTotal]);

  const onClick = useCallback(async () => {
    if (!publicKey) {
      notify({ type: 'error', message: `Wallet not connected!` });
      console.log('error', `Send Transaction: Wallet not connected!`);
      return;
    }
    setIsProcessing(true);
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
          Buffer.from(anchor.utils.bytes.utf8.encode('user_config_v1')),
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

    const quantityNative = new anchor.BN(
      (parseFloat(depositAmount) / 2) * 1000000
    );

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
        quantityNative,
        false,
        {
          accounts: {
            state,
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
          quantityNative,
          false,
          {
            accounts: {
              state,
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
      setIsProcessing(false);
      setIsModalOpened(false);
      notify({
        type: 'success',
        message: 'Transaction successful!',
        txid: signature,
      });
    } catch (error: any) {
      setIsProcessing(false);
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
  }, [wallet, publicKey, connection, sendTransaction, depositAmount]);

  if (!butlerAccountOwner || !mangoAccount) {
    return <div></div>;
  }

  return (
    <>
      <label
        onClick={() => {
          setIsModalOpened(true);
        }}
        htmlFor="deposit-modal"
        className="btn modal-button btn m-2 bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500"
      >
        Deposit
      </label>

      <input
        type="checkbox"
        id="deposit-modal"
        className="modal-toggle"
        checked={isModalOpened}
      />
      <div className="modal">
        <div className="modal-box relative p-0 rounded-md bg-depositModal pb-2">
          <div className="flex justify-between items-start rounded-t border-b border-gray-600 pt-5 pb-5 pr-7 pl-7">
            <h3 className="text-xl font-semibold lg:text-2xl  bg-clip-text text-transparent  bg-gradient-to-br from-[#9945FF] to-[#14F195]">
              Deposit
            </h3>
            <label
              onClick={() => {
                setIsProcessing(false);
                setDepositOverLimit(false);
                setDepositOverWalletTotal(false);
                setTotalColateral(currentColateral);
                setDepositAmount('');
                setIsModalOpened(false);
              }}
              htmlFor="deposit-modal"
              className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
              data-modal-toggle="defaultModal"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </label>
          </div>

          <div className="py-4 pr-7 pl-7 pb-2">
            <div className="form-control w-full ">
              <label className="label">
                <span className="label-text text-md">Deposit Amount</span>
              </label>
              <Input
                type="number"
                value={depositAmount}
                error={depositOverLimit || depositOverWalletTotal}
                errorText={inputError}
                leftIcon={<div>USDC</div>}
                onChange={(e) => {
                  setDepositOverLimit(
                    parseFloat(e.target.value) > remainingMaxDeposit
                  );
                  setDepositOverWalletTotal(
                    parseFloat(e.target.value) > usdcBalannce
                  );
                  setDepositAmount(e.target.value);
                  setTotalColateral(
                    currentColateral +
                      (e.target.value.length === 0
                        ? 0
                        : parseFloat(e.target.value))
                  );
                }}
              />
              <label className="label">
                <span className="label-text-alt" />
                <span className="label-text-alt">
                  <div className="text-right">
                    Remaining Deposit Limit:{' '}
                    {numberToCurrency('en-US', 'USD', remainingMaxDeposit)}
                  </div>
                  <div className="text-right">
                    Wallet USDC Balance:{' '}
                    {numberToCurrency('en-US', 'USD', usdcBalannce)}
                  </div>
                </span>
              </label>
            </div>
          </div>
          <div className="py-4 pr-7 pl-7 pt-2">
            <div className="divider mb-2"></div>
            <div className="flex justify-between">
              <div>Current Balance</div>
              <div>{numberToCurrency('en-US', 'USD', currentColateral)}</div>
            </div>
            {isConfirmDisabled() ? null : (
              <div className="flex justify-between">
                <div>Deposit Amount</div>
                <div className="text-green-600">
                  +{' '}
                  {numberToCurrency('en-US', 'USD', parseFloat(depositAmount))}
                </div>
              </div>
            )}
            <div className="divider" />
            <div className="flex justify-between pb-4">
              <div>Total Colateral</div>
              <div>{numberToCurrency('en-US', 'USD', totalColateral)}</div>
            </div>

            <button
              disabled={isConfirmDisabled()}
              onClick={onClick}
              className={`btn btn-wide w-full bg-gradient-to-r 
              from-[#9945FF] to-[#14F195]
               hover:from-pink-500 hover:to-yellow-500
                ${isProcessing ? 'loading' : null} `}
            >
              {isProcessing ? (
                <div>
                  <div>Processing...</div>
                </div>
              ) : (
                <div>Confirm Deposit</div>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
