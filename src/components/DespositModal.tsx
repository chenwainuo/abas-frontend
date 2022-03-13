import React from 'react';

/**
 * Primary UI component for user interaction
 */
export const DepositModal = () => {
  return (
    <>
      <label htmlFor="my-modal-3" className="btn modal-button">
        Deposit
      </label>

      <input type="checkbox" id="my-modal-3" className="modal-toggle" />
      <div className="modal rounded-md">
        <div className="modal-box relative p-0 rounded-md">
          {/* <h3 className="text-lg font-bold left-2">
            Congratulations random Interner user!
          </h3>
          <label
            htmlFor="my-modal-3"
            className="btn btn-sm btn-circle absolute right-2 top-2"
          >
            ✕
          </label> */}
          <div className="flex justify-between items-start rounded-t border-b dark:border-gray-600 pt-5 pb-5 pr-7 pl-7">
            <h3 className="text-xl font-semibold text-white-600 lg:text-2xl dark:text-white">
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

          <p className="py-4 pr-7 pl-7">
            <div className="form-control w-full ">
              <label className="label">
                <span className="label-text text-md">Deposit Amount</span>
                <button>
                  <span className="label-text-alt underline">Max</span>
                </button>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="100"
                  className="input input-bordered w-full"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-2">
                  <div>USDC</div>
                </span>
              </div>
              <label className="label">
                <span className="label-text-alt">
                  <div>Remaining Max Deposit: </div>
                  <div>Wallet USDC Balance: </div>
                </span>
              </label>
            </div>
          </p>
          <p className="py-4 pr-7 pl-7 pt-10">
            <div className="text-sm">
              Don&apos;t have USDC?{' '}
              <button>
                <span className="underline">Buy some here</span>
              </button>
            </div>
            <div className="divider mb-2"></div>
            <div className="flex justify-between pb-4">
              <div>Total Colateral</div>
              <div>02</div>
            </div>

            <button className="btn btn-wide w-full">Confirm Deposit</button>
          </p>
        </div>
      </div>
    </>
  );
};
