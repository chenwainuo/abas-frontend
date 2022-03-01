import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {Keypair, PublicKey, SystemProgram, Transaction, TransactionSignature} from '@solana/web3.js';
import { FC, useCallback } from 'react';
import { notify } from "../utils/notifications";
import {
    BUTLER_PROGRAM_KEY,
    DRIFT_PROGRAM_KEY,
    DRIFT_STATE_KEY, MANGO_CACHE_KEY, MANGO_DRFIT_CONFIG, MANGO_GROUP_CONFIG_KEY,
    MANGO_PROGRAM_KEY, MangoDriftConfig,
    USDC_MINT_KEY
} from "../models/constants";
import {Butler} from "../models/butler";
import {BN, Program} from "@project-serum/anchor";
import {ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {ClearingHouse, DriftEnv, initialize, PositionDirection,} from '@drift-labs/sdk';

export type EmergencyCloseButtonProps = {
    show: boolean,
    mangoAccount: PublicKey,
    butlerAccountOwner: PublicKey,
    closingMarket: String,
    closingSize: number,
    driftDirection: PositionDirection
}


export const EmergencyCloseButton: FC<EmergencyCloseButtonProps> = (props) => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction, wallet } = useWallet();


    const onClick = useCallback(async () => {
        if (!publicKey) {
            notify({ type: 'error', message: `Wallet not connected!` });
            console.log('error', `Send Transaction: Wallet not connected!`);
            return;
        }
        const anchor = require("@project-serum/anchor");

        const [accountOwner, accountOwnerBump] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from(anchor.utils.bytes.utf8.encode("butler_account_owner_v1")), publicKey.toBuffer()],
            BUTLER_PROGRAM_KEY
        )

        const [mangoAccountPk, mangoAccountBump] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from(anchor.utils.bytes.utf8.encode("mango_account_v1")), publicKey.toBuffer()],
            BUTLER_PROGRAM_KEY
        )

        const [driftAccountPk, driftAccountBump] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from(anchor.utils.bytes.utf8.encode('user')), accountOwner.toBuffer()],
            DRIFT_PROGRAM_KEY
        );

        const clearingHouse = ClearingHouse.from(
            connection,
            null,
            DRIFT_PROGRAM_KEY
        );
        await clearingHouse.subscribe()

        const clearingHouseState = clearingHouse.getStateAccount();
        const driftUserData = await clearingHouse.program.account.user.fetch(driftAccountPk.toString())
        const clearingHouseUserPositions = driftUserData.positions

        const provider = new anchor.Provider(connection, wallet);
        const program = await anchor.Program.at(BUTLER_PROGRAM_KEY, provider) as Program<Butler>
        const optionalAccounts = {
            discountToken: false,
            referrer: false,
        };

        const configs = MANGO_DRFIT_CONFIG[props.closingMarket.toString()] as MangoDriftConfig;

        const quantityNative = new anchor.BN(props.closingSize * configs.toMangoBaseUnitMultiplier)

        let signature: TransactionSignature = '';
        try {
            const accounts =  {
                    butlerAccountOwner: accountOwner,
                    clearingHouseState: DRIFT_STATE_KEY,
                    clearingHouseUser: driftAccountPk,
                    clearingHouseUserPositions: clearingHouseUserPositions,
                    clearingHouseProgram: DRIFT_PROGRAM_KEY,
                    clearingHouseMarkets: clearingHouseState.markets,
                    clearingHouseFundingPaymentHistory: clearingHouseState.fundingPaymentHistory,
                    clearingHouseFundingRateHistory: clearingHouseState.fundingRateHistory,
                    clearingHouseTradeHistory: clearingHouseState.tradeHistory,
                    oracle: configs.pythOracle,
                    mangoAccountPk: mangoAccountPk,
                    mangoGroupAi: MANGO_GROUP_CONFIG_KEY,
                    mangoCacheAi: MANGO_CACHE_KEY,
                    mangoProgram: MANGO_PROGRAM_KEY,
                    perpMarketAi: configs.mangoPerpMarketKey,
                    bidsAi: configs.mangoBidKey,
                    asksAi: configs.mangoAskKey,
                    eventQueueAi: configs.eventsKey,
                    emptyAi: PublicKey.default,
                    signer: publicKey,
                }


            const emergencyCloseIx = await program.instruction.closeArbOrder(accountOwnerBump, props.driftDirection, quantityNative, new anchor.BN(configs.driftIndex), new anchor.BN(0), optionalAccounts, {
                accounts
            })

            signature = await sendTransaction(new Transaction().add(emergencyCloseIx), connection);

            console.log("signature", signature)
            await connection.confirmTransaction(signature, 'confirmed');
            notify({ type: 'success', message: 'Transaction successful!', txid: signature });
        } catch (error: any) {
            notify({ type: 'error', message: `Transaction failed!`, description: error?.message, txid: signature });
            console.log('error', `Transaction failed! ${error?.message}`, signature);
            return;
        }
    }, [publicKey, notify, connection, sendTransaction]);

    if (!props.show || !props.butlerAccountOwner || !props.mangoAccount) {
        return <div></div>
    }
    return (
        <div>
            <button
                className="btn m-2 bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ..."
                onClick={onClick} disabled={!publicKey}
            >
                <span> Emergency Close </span>
            </button>
        </div>
    );
}
