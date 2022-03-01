import {PublicKey} from "@solana/web3.js";

export type EndpointTypes = 'mainnet' | 'devnet' | 'localnet'

export type PositionUiRow = {
    marketNamePerp: String,
    driftQuote: Number,
    driftBase: Number,
    mangoBase: Number,
    isDriftLong: boolean,
    driftFundingRate: Number,
    mangoFundingRate: Number,
    estFundingRev: Number,
    estApr: Number
}

export type UserConfigType = {
    userWallet: PublicKey,
    userCranker: PublicKey,
    tradeSize: number,
    openSpread: number,
    closeSpread: number,
    mode: number
}
