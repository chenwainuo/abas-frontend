// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import {Connection, PublicKey} from "@solana/web3.js";
import {
  BUTLER_PROGRAM_KEY,
  DRIFT_PROGRAM_KEY, MANGO_CACHE_KEY,
  MANGO_GROUP_CONFIG_KEY,
  MANGO_PROGRAM_KEY,
  RPC_URL, USDC_MINT_KEY
} from "../../../models/constants";
import {BN, Program} from "@project-serum/anchor";
import {Butler} from "../../../models/butler";
import {UserConfigType} from "../../../models/types";
import {MangoAccount, MangoCache, MangoClient, MangoGroup} from "@blockworks-foundation/mango-client";
import {ClearingHouse, ClearingHouseUser} from "@drift-labs/sdk";
import {getAssociatedTokenAddress} from "@solana/spl-token";

export type UserInfoData = {
  positionUi: any[],
  mangoAccount: PublicKey,
  accountInitialized: boolean,
  butlerAccountOwner: PublicKey,
  userConfig: UserConfigType,
  mangoAccountValue: number,
  driftAccountValue: number,
  userUsdcBalance: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UserInfoData>
) {
  const { user } = req.query
  const userPkey = new PublicKey(user.toString())

  const connection = new Connection(RPC_URL)


  const anchor = require("@project-serum/anchor");
  const PROGRAM_ID = BUTLER_PROGRAM_KEY
  const provider = new anchor.Provider(connection, null);
  const program = await anchor.Program.at(PROGRAM_ID, provider) as Program<Butler>

  const [mangoAccountPk, mangoAccountBump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode("mango_account_v1")), userPkey.toBuffer()],
      program.programId
  )
  const mangoAccountInfo = await connection.getAccountInfoAndContext(mangoAccountPk)
  const [accountOwner, accountOwnerBump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode("butler_account_owner_v1")), userPkey.toBuffer()],
      program.programId
  )
  const [userConfigPk, userConfigBump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode("butler_user_config_v1")), userPkey.toBuffer()],
      BUTLER_PROGRAM_KEY
  )

  const positionsUi = []
  let userConfig: UserConfigType = {
    closeSpread: 0, mode: 0, openSpread: 0, tradeSize: 0, userCranker: undefined, userPubkey: undefined
  }

  if (mangoAccountInfo.value == null) {
    res.status(200).json({
      driftAccountValue: undefined, mangoAccountValue: undefined,
      accountInitialized: false,
      butlerAccountOwner: undefined,
      mangoAccount: undefined,
      positionUi: [],
      userConfig: undefined
    })
  }
  const userConfigData = await program.account.userConfig.fetch(userConfigPk)
  userConfig = userConfigData
  const mangoClient = new MangoClient(connection, MANGO_PROGRAM_KEY);
  const mangoGroup = await mangoClient.getMangoGroup(MANGO_GROUP_CONFIG_KEY)
  const mangoAccount = await mangoClient.getMangoAccount(mangoAccountPk, MANGO_PROGRAM_KEY)
  const getMangoPositions = async (connection, mangoGroup: MangoGroup, mangoAccount: MangoAccount) => {
    const solPerpMarket = await mangoGroup.loadPerpMarket(
        connection,
        3,
        9,
        6,
    )
    const btcPerpMarket = await mangoGroup.loadPerpMarket(
        connection,
        1,
        6,
        6,
    )
    const avaxPerpMarket = await mangoGroup.loadPerpMarket(
        connection,
        12,
        8,
        6,
    )
    const lunaPerpMarket = await mangoGroup.loadPerpMarket(
        connection,
        13,
        6,
        6,
    )
    return {
      'SOL-PERP': mangoAccount.getPerpPositionUi(3, solPerpMarket),
      'BTC-PERP': mangoAccount.getPerpPositionUi(1, btcPerpMarket),
      'AVAX-PERP': mangoAccount.getPerpPositionUi(12, avaxPerpMarket),
      'LUNA-PERP': mangoAccount.getPerpPositionUi(13, lunaPerpMarket),
      'ETH-PERP': mangoAccount.getPerpPositionUi(2, lunaPerpMarket),
    }
  }

  const mangoPositions = await getMangoPositions(connection, mangoGroup, mangoAccount)
  const mangoAccountValue = mangoAccount.getEquityUi(mangoGroup, await mangoGroup.loadCache(connection)) * 1000000
  const clearingHouse = ClearingHouse.from(
      connection,
      null,
      DRIFT_PROGRAM_KEY
  );
  await clearingHouse.subscribe()

  const driftUser = ClearingHouseUser.from(clearingHouse, accountOwner)
  await driftUser.subscribe()
  const driftPositions = driftUser.getUserPositionsAccount().positions
  const driftAccountValue = driftUser.getTotalCollateral().toNumber() / 1000000

  /// calculate for funding revenue, apy etc.
  await Promise.all(driftPositions.map(async p => {
    const getMangoFundings = async (marketName) => {
      const stats = await (await fetch("https://mango-stats-v3.herokuapp.com/perp/funding_rate?mangoGroup=mainnet.1&market=" + marketName)).json()

      const newest_stats = stats[0]
      const oldest_stats = stats[stats.length - 1]
      const oldest_short_funding = parseFloat(oldest_stats["shortFunding"])
      const oldest_long_funding = parseFloat(oldest_stats["longFunding"])
      const newest_short_funding = parseFloat(newest_stats["shortFunding"])
      const newest_long_funding = parseFloat(newest_stats["longFunding"])
      const newest_oracle_price = parseFloat(newest_stats["baseOraclePrice"])
      const start_funding = (oldest_long_funding + oldest_short_funding) / 2
      const end_funding = (newest_long_funding + newest_short_funding) / 2
      const funding_difference = end_funding - start_funding

      const funding_rate = funding_difference / newest_oracle_price / 100
      console.log(marketName, funding_rate)
      return funding_rate
    }
    let marketName = ""
    switch (p.marketIndex.toNumber()) {
      case 0:
        marketName = "SOL";
        break;
      case 1:
        marketName = "BTC";
        break;
      case 2:
        marketName = "ETH";
        break;
      case 3:
        marketName = "LUNA";
        break;
      case 4:
        marketName = "AVAX";
        break;
    }
    let marketNamePerp = marketName + "-PERP"
    const driftQuote = p.quoteAssetAmount.toNumber() / 1000000
    if (driftQuote === 0) {
      return
    }

    let mangoFundingRate = await getMangoFundings(marketNamePerp) * 24 * 365


    const driftBase = p.baseAssetAmount.div(new BN("10000000000")).toNumber() / 1000
    const isDriftLong = p.baseAssetAmount.toNumber() > 0
    const market = clearingHouse.getMarket(p.marketIndex);
    const marketTwap = market.amm.lastMarkPriceTwap.toNumber()
    const oracleTwap = (market.amm.lastOraclePriceTwap).toNumber()
    const driftFundingRate = (marketTwap - oracleTwap) / oracleTwap * 100 * (1 / 24) * 24 * 365

    const driftFundingMultiplier = isDriftLong ? -1 : 1;
    const driftFundingRev = driftQuote * driftFundingRate * driftFundingMultiplier / 100 / 24 / 365
    const mangoFundingRev = driftQuote * mangoFundingRate * driftFundingMultiplier * -1 / 100 / 24 / 365
    const estFundingRev = driftFundingRev + mangoFundingRev
    const fundingRateSum = driftFundingRate * driftFundingMultiplier + (mangoFundingRate * driftFundingMultiplier * -1)
    const estApr = fundingRateSum * driftQuote / (driftAccountValue + mangoAccountValue)
    positionsUi.push({
        marketNamePerp,
        driftQuote,
        driftBase,
        mangoBase: mangoPositions[marketNamePerp],
        isDriftLong,
        driftFundingRate,
        mangoFundingRate,
        estFundingRev,
        estApr
    });
  }))

  const userUsdcAccount = await getAssociatedTokenAddress(USDC_MINT_KEY, userPkey)
  const userUsdcBalance = (await connection.getTokenAccountBalance(userUsdcAccount)).value.uiAmount;

  console.log("user usdc balance", userUsdcBalance)
  clearingHouse.unsubscribe()
  driftUser.unsubscribe()

  res.status(200).json({
    accountInitialized: true,
    mangoAccount: mangoAccountPk,
    positionUi: positionsUi,
    butlerAccountOwner: accountOwner,
    userConfig: userConfig,
    mangoAccountValue,
    driftAccountValue,
    userUsdcBalance
  })
}
