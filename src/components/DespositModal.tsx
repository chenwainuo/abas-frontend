import React, { useCallback, useState } from 'react';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';

import Input from '@/components/Input';
import { numberToCurrency } from '@/utils/currency';

export interface DepositModalProps {
  usdcBalannce: number;
  depositLimit: number;
  currentColateral: number;
}
export const DepositModal = ({
  usdcBalannce,
  depositLimit,
  currentColateral,
}: DepositModalProps) => {
  const [depositAmount, setDepositAmount] = useState('');
  const [totalColateral, setTotalColateral] = useState(currentColateral);
  const [depositOverLimit, setDepositOverLimit] = useState(false);
  const { connection } = useConnection();
  const { publicKey, sendTransaction, wallet } = useWallet();
  const remainingMaxDeposit = depositLimit - currentColateral;
  const isConfirmDisabled = useCallback(() => {
    return depositAmount === '';
  }, [depositAmount]);
  const onClick = useCallback(async () => {
    console.log(depositAmount === null, depositAmount === '');
    console.log('clicked', depositAmount);
  }, [wallet, publicKey, connection, sendTransaction, depositAmount]);
  return (
    <>
      <label
        htmlFor="my-modal-3"
        className="btn modal-button btn m-2 bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500"
      >
        Deposit
      </label>

      <input type="checkbox" id="my-modal-3" className="modal-toggle" />
      <div className="modal">
        <div className="modal-box relative p-0 rounded-md bg-depositModal">
          <div className="flex justify-between items-start rounded-t border-b border-gray-600 pt-5 pb-5 pr-7 pl-7">
            <h3 className="text-xl font-semibold lg:text-2xl  bg-clip-text text-transparent  bg-gradient-to-br from-[#9945FF] to-[#14F195]">
              Deposit
            </h3>
            <label
              htmlFor="my-modal-3"
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
              {/* <div className="relative"> */}
              <Input
                type="number"
                error={depositOverLimit}
                errorText="Enter an amount less than deposit limit"
                leftIcon={<div>USDC</div>}
                onChange={(e) => {
                  setDepositOverLimit(
                    parseFloat(e.target.value) > remainingMaxDeposit
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
              disabled={isConfirmDisabled() || depositOverLimit}
              onClick={onClick}
              className="btn btn-wide w-full bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500
                disabled:bg-white"
            >
              Confirm Deposit
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
