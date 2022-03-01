import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {Keypair, PublicKey, SystemProgram, Transaction, TransactionSignature} from '@solana/web3.js';
import { FC, useCallback } from 'react';
import { notify } from "../utils/notifications";
import {
    BUTLER_PROGRAM_KEY,
    DRIFT_PROGRAM_KEY,
    DRIFT_STATE_KEY, MANGO_CACHE_KEY, MANGO_DRFIT_CONFIG, MANGO_GROUP_CONFIG_KEY,
    MANGO_PROGRAM_KEY, MANGO_USDC_NODE_KEY, MANGO_USDC_ROOT_KEY, MANGO_USDC_VAULT, MangoDriftConfig, USDC_MINT_KEY,
} from "../models/constants";
import {Butler} from "../models/butler";
import {BN, Program} from "@project-serum/anchor";
import {ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {ClearingHouse, DriftEnv, initialize, PositionDirection,} from '@drift-labs/sdk';

export type DepositUSDCProps = {
    show: boolean,
    mangoAccount: PublicKey,
    butlerAccountOwner: PublicKey,
}

export const DepositUSDC: FC<DepositUSDCProps> = (props) => {
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

        const [state, stateBump] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from(anchor.utils.bytes.utf8.encode("state_v1"))],
            BUTLER_PROGRAM_KEY
        )
        const [userConfig, userConfigBump] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from(anchor.utils.bytes.utf8.encode("user_config_v1")), publicKey.toBuffer()],
            BUTLER_PROGRAM_KEY
        )


        const [driftAccountPk, driftAccountBump] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from(anchor.utils.bytes.utf8.encode('user')), accountOwner.toBuffer()],
            DRIFT_PROGRAM_KEY
        );

        const [butlerDriftCollateralVault, butlerDriftCollateralBump] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from(anchor.utils.bytes.utf8.encode("butler_drift_collateral_vault_v1")), publicKey.toBuffer()],
            BUTLER_PROGRAM_KEY
        )

        const [butlerMangoCollateralVault, butlerMangoCollateralBump] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from(anchor.utils.bytes.utf8.encode("butler_mango_collateral_vault_v1")), publicKey.toBuffer()],
            BUTLER_PROGRAM_KEY
        )

        const [clearingHouseCollateralVault, _bump]= await PublicKey.findProgramAddress(
            [Buffer.from(anchor.utils.bytes.utf8.encode('collateral_vault'))],
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
        console.log("positions", clearingHouseUserPositions.toString())

        const provider = new anchor.Provider(connection, wallet);

        const program = await anchor.Program.at(BUTLER_PROGRAM_KEY, provider) as Program<Butler>

        const quantityNative = new anchor.BN(100 /2 * 1000000)

        const userDriftCollateralAccount = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, USDC_MINT_KEY, publicKey)

        let signature: TransactionSignature = '';
        try {

            const depositUsdcIx = await program.instruction.depositCollateral(stateBump, accountOwnerBump, butlerDriftCollateralBump, butlerMangoCollateralBump, quantityNative, false, {
                accounts: {
                    state: state,
                    userDriftCollateralAccount: userDriftCollateralAccount,
                    userMangoCollateralAccount: userDriftCollateralAccount,
                    butlerDriftCollateralVault,
                    butlerMangoCollateralVault,
                    butlerAccountOwner: accountOwner,
                    clearingHouseState: DRIFT_STATE_KEY,
                    clearingHouseUser: driftAccountPk,
                    clearingHouseCollateralVault: clearingHouseCollateralVault,
                    clearingHouseUserPositions: clearingHouseUserPositions,
                    clearingHouseFundingPaymentHistory: clearingHouseState.fundingPaymentHistory,
                    clearingHouseDepositHistory: clearingHouseState.depositHistory,
                    clearingHouseMarkets: clearingHouseState.markets,
                    clearingHouseProgram: clearingHouse.program.programId,
                    signer: publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID
                },
            })
            const depositMangoUsdcIx = await program.instruction.depositMangoCollateral(stateBump, mangoAccountBump, accountOwnerBump, butlerMangoCollateralBump, butlerDriftCollateralBump, quantityNative, false, {
                accounts: {
                    state: state,
                    userMangoCollateralAccount: userDriftCollateralAccount,
                    butlerDriftCollateralVault,
                    butlerMangoCollateralVault,
                    butlerAccountOwner: accountOwner,
                    mangoProgram: MANGO_PROGRAM_KEY,
                    mangoGroupAi: MANGO_GROUP_CONFIG_KEY,
                    mangoAccountPk: mangoAccountPk,
                    mangoCacheAi: MANGO_CACHE_KEY,
                    rootBankAi:MANGO_USDC_ROOT_KEY ,
                    nodeBankAi: MANGO_USDC_NODE_KEY,
                    vaultAi: MANGO_USDC_VAULT,
                    signer: publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID
                },
            })

            signature = await sendTransaction(new Transaction().add(depositUsdcIx).add(depositMangoUsdcIx), connection);

            console.log("signature", signature)
            await connection.confirmTransaction(signature, 'confirmed');
            notify({ type: 'success', message: 'Transaction successful!', txid: signature });
        } catch (error: any) {
            notify({ type: 'error', message: `Transaction failed!`, description: error?.message, txid: signature });
            console.log('error', `Transaction failed! ${error?.message}`, signature);
            return;
        }
    }, [publicKey, notify, connection, sendTransaction]);


    console.log(props)

    if (!props.show || !props.butlerAccountOwner || !props.mangoAccount) {
        return <div></div>
    }
    return (
        <div>
            {<a target="_blank" href={`https://app.drift.trade/AVAX?authority=${props.butlerAccountOwner.toString()}`}> <button className="btn m-2 bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ..."> Drift Account </button></a>}
            {<a target="_blank" href={`https://trade.mango.markets/account?pubkey=${props.mangoAccount.toString()}`}><button className="btn m-2 bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ..."> Mango Account </button></a>}
            {<a target="_blank" href={`https://p.datadoghq.com/sb/1e87a1b8-5085-11ec-a6b0-da7ad0900002-70b44d89dce3a234ead0846e06e707aa`}><button className="btn m-2 bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ..."> Dashboard</button></a>}

            <button
                className="btn m-2 bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ..."
                onClick={onClick} disabled={!publicKey}
            >
                <span> Deposit 100 </span>
            </button>
        </div>
    );
}
