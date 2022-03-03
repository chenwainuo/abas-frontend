import {useConnection, useWallet} from '@solana/wallet-adapter-react';
import {PublicKey, Transaction, TransactionSignature} from '@solana/web3.js';
import {FC, useCallback, useEffect, useState} from 'react';
import {notify} from "../utils/notifications";
import {
    BUTLER_PROGRAM_KEY,
    DRIFT_PROGRAM_KEY,
    DRIFT_STATE_KEY,
    MANGO_GROUP_CONFIG_KEY,
    MANGO_PROGRAM_KEY,
    MANGO_USDC_NODE_KEY,
    MANGO_USDC_ROOT_KEY,
    USDC_MINT_KEY
} from "../models/constants";
import {Butler} from "../models/butler";
import {Program} from "@project-serum/anchor";
import {ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {ClearingHouse, ClearingHouseUser, PositionDirection} from '@drift-labs/sdk';
import {MangoClient} from "@blockworks-foundation/mango-client";
import useUserSOLBalanceStore from "../stores/useUserSOLBalanceStore";
import {PositionUiRow} from "../models/types";
import {EmergencyCloseButton} from "./EmergencyCloseButton";
import {UserInfoData} from "../pages/api/info/[user]";
export type ButlerTableRow = {

}

export type AccountTable = {
    show: boolean,
    mangoAccount: PublicKey
    butlerAccountOwner: PublicKey
    rows: Array<PositionUiRow>
}

export const AccountTable: FC<AccountTable> = (props) => {
    if (!props.show || !props.butlerAccountOwner || !props.mangoAccount) {
        return <div></div>
    }

    if (props.rows.length === 0) {
        return ( <div>
            <a> 👀 Abas keeper is workign hard to get a good price entry for you, patience is a virtue! </a>
            <a> Meanwhile drop by our <a href={"http://discord.gg/4rNmEWNZU5"}>Discord</a> and say hi! </a>
        </div>)
    }

    return (
        <div>
            <table>
                <thead>
                    <tr>
                    <th>Market</th>
                    <th>Drift Position</th>
                    <th>Mango Position</th>
                    <th>Drift est. FR</th>
                    <th>Mango est. FR</th>
                    <th>est. 1H FR Revenue</th>
                        <th>est. APR</th>
                        <th>Exit</th>
                    </tr>
                </thead>
                <tbody>
                {props.rows.map((row) => {
                    return (<tr>
                        <td>{row.marketNamePerp}</td>
                        <td>{row.driftBase}</td>
                        <td>{row.mangoBase}</td>
                        <td>{row.driftFundingRate.toFixed(2)}%</td>
                        <td>{row.mangoFundingRate.toFixed(2)}%</td>
                        <td>${row.estFundingRev.toFixed(2)}</td>
                        <td>{row.estApr.toFixed(2)}%</td>
                    </tr>)
                })}
                <tr>
                    <td>Total</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td>${props.rows.map(p => p.estFundingRev).reduce((a, b) => +a + +b, 0).toFixed(2)}</td>
                    <td>{props.rows.map(p => p.estApr).reduce((a, b) => +a + +b, 0).toFixed(2)}%</td>
                </tr>
                </tbody>

            </table>
        </div>
    );
};
