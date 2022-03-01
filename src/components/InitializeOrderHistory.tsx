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
import {ClearingHouse, DriftEnv, getUserOrdersAccountPublicKey, initialize, PositionDirection,} from '@drift-labs/sdk';

export type DepositUSDCProps = {
    show: boolean,
    mangoAccount: PublicKey,
    butlerAccountOwner: PublicKey,
}

export const InitializeOrderHistory: FC<DepositUSDCProps> = (props) => {
    const { connection } = useConnection();
    const wallet = useWallet();
    const publicKey = wallet.publicKey;
    const sendTransaction = wallet.sendTransaction


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
            [Buffer.from(anchor.utils.bytes.utf8.encode("butler_user_config_v1")), publicKey.toBuffer()],
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
            wallet,
            DRIFT_PROGRAM_KEY
        );
        await clearingHouse.subscribe()
        const driftUserData = await clearingHouse.program.account.user.fetch(driftAccountPk.toString())
        const clearingHouseUserPositions = driftUserData.positions
        console.log("positions", clearingHouseUserPositions.toString())

        let signature: TransactionSignature = '';
        try {
            const clearingHouseUserPositionsKey = await getUserOrdersAccountPublicKey(DRIFT_PROGRAM_KEY, driftAccountPk)
            const initializeUserOrderIx = await clearingHouse.getInitializeUserOrdersInstruction(clearingHouseUserPositionsKey)
            console.log("clearingHouseUserPositionsKey", clearingHouseUserPositionsKey.toString())
            console.log("initializeUserOrderIx", initializeUserOrderIx)

            signature = await sendTransaction(new Transaction().add(initializeUserOrderIx), connection, {skipPreflight: true});

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
            <button
                className="btn m-2 bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ..."
                onClick={onClick} disabled={!publicKey}
            >
                <span> Initialize Order History </span>
            </button>
        </div>
    );
}
