import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionSignature} from '@solana/web3.js';
import React, { FC, useCallback, useEffect } from 'react';
import { notify } from "../utils/notifications";
import {
    BUTLER_PROGRAM_KEY,
    DRIFT_PROGRAM_KEY,
    DRIFT_STATE_KEY,
    MANGO_CACHE_KEY,
    MANGO_DRFIT_CONFIG,
    MANGO_GROUP_CONFIG_KEY,
    MANGO_PROGRAM_KEY,
    MANGO_USDC_NODE_KEY,
    MANGO_USDC_ROOT_KEY,
    MANGO_USDC_VAULT,
    MangoDriftConfig,
    RPC_URL,
    USDC_MINT_KEY,
} from "../models/constants";
import {Butler} from "../models/butler";
import {BN, Program} from "@project-serum/anchor";
import {ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {ClearingHouse, DriftEnv, initialize, PositionDirection,} from '@drift-labs/sdk';
import {UserConfigType} from "../models/types"
import {FormControl, InputLabel, MenuItem, Select} from "@mui/material";

export type UserConfigProps = {
    show: boolean,
    mangoAccount: PublicKey,
    butlerAccountOwner: PublicKey,
    userConfig: UserConfigType,
    isLoading: boolean
}



export const UserConfig: FC<UserConfigProps> = (props) => {
    const connection = new Connection(RPC_URL)
    const { publicKey, sendTransaction, wallet } = useWallet();

    const [userConfigMode, setUserConfigMode] = React.useState('');
    const [openSpread, setOpenSpread] = React.useState('');
    const [closeSpread, setCloseSpread] = React.useState('');
    const handleUserConfigModeChange = (event) => {
        setUserConfigMode(event.target.value);
    };
    const handleOpenSpreadChange = (event) => {
        setOpenSpread(event.target.value);
    };
    const handleCloseSpreadChange = (event) => {
        setCloseSpread(event.target.value);
    };

    const onClick = useCallback(async (closeSpread, openSpread, mode, tradeSize, userCranker) => {
        if (!publicKey) {
            notify({ type: 'error', message: `Wallet not connected!` });
            console.log('error', `Send Transaction: Wallet not connected!`);
            return;
        }
        const anchor = require("@project-serum/anchor");
        const [userConfig, userConfigBump] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from(anchor.utils.bytes.utf8.encode("butler_user_config_v1")), publicKey.toBuffer()],
            BUTLER_PROGRAM_KEY
        )
        const provider = new anchor.Provider(connection, wallet);
        const program = await anchor.Program.at(BUTLER_PROGRAM_KEY, provider) as Program<Butler>
        let signature: TransactionSignature = '';
        try {
            console.log(closeSpread, openSpread, tradeSize, mode)
            const updateUserConfig = await program.instruction.updateUserConfig(userConfigBump, new BN(closeSpread), new BN(openSpread), new BN(tradeSize), new BN(mode), {
                accounts: {
                    userConfig,
                    userCranker: userCranker,
                    signer: publicKey,
                },
            })
            signature = await sendTransaction(new Transaction().add(updateUserConfig), connection, {skipPreflight: true});

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

    let displayMode = userConfigMode === '' ? props.userConfig.mode : userConfigMode
    let displayOpenSpread = openSpread === '' ? props.userConfig.openSpread : openSpread
    let displayCloseSpread = closeSpread === '' ? props.userConfig.closeSpread : closeSpread

    return (
        <div>

            <div>
                <p>Trading  Mode:</p>
                <FormControl fullWidth>
                    <Select
                        value={displayMode}
                        label="Mode"
                        onChange={handleUserConfigModeChange}
                    >
                        <MenuItem value={0}>Enable</MenuItem>
                        <MenuItem value={1}>Disable</MenuItem>
                        <MenuItem value={2}>Exit Only</MenuItem>
                    </Select>
                </FormControl>

            </div>
            <div>
                <p>Open Spread</p>
                <FormControl fullWidth>
                    <Select
                        value={displayOpenSpread}
                        label="Mode"
                        onChange={handleOpenSpreadChange}
                    >
                        <MenuItem value={50}>50</MenuItem>
                        <MenuItem value={30}>30</MenuItem>
                        <MenuItem value={15}>15</MenuItem>
                    </Select>
                </FormControl>
            </div>
            <div>
                <p>Close Spread</p>
                <FormControl fullWidth sx={{ borderColor: 'white' }}>
                    <Select
                        value={displayCloseSpread}
                        label="Mode"
                        onChange={handleCloseSpreadChange}
                        sx={{ borderColor: 'white' }}
                    >
                        <MenuItem value={30}>30</MenuItem>
                        <MenuItem value={15}>15</MenuItem>
                        <MenuItem value={10}>10</MenuItem>
                        <MenuItem value={0}>0</MenuItem>
                        <MenuItem value={-10}>-10</MenuItem>
                        <MenuItem value={-15}>-15</MenuItem>
                        <MenuItem value={-30}>-30</MenuItem>
                    </Select>
                </FormControl>
            </div>
            <p>Trade Size: {props.userConfig?.tradeSize}</p>
            <button
                className="btn m-2 bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ..."
                onClick={() => {onClick(displayCloseSpread, displayOpenSpread, displayMode, props.userConfig.tradeSize, props.userConfig.userCranker)}}
            >
                <span> Save Config </span>
            </button>
        </div>
    );
}
