// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import {
  MangoAccount,
  MangoClient,
  MangoGroup,
} from '@blockworks-foundation/mango-client';
import { ClearingHouse, ClearingHouseUser } from '@drift-labs/sdk';
import { BN, Program } from '@project-serum/anchor';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';
import type { NextApiRequest, NextApiResponse } from 'next';

import { Butler } from '../../../models/butler';
import {
  BUTLER_PROGRAM_KEY,
  DRIFT_PROGRAM_KEY,
  MANGO_GROUP_CONFIG_KEY,
  MANGO_PROGRAM_KEY,
  RPC_URL,
  USDC_MINT_KEY,
} from '../../../models/constants';
import { UserConfigType } from '../../../models/types';

const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 60, checkperiod: 30 });

export type UserInfoData = {
  positionUi: any[];
  mangoAccount: PublicKey;
  accountInitialized: boolean;
  butlerAccountOwner: PublicKey;
  userConfig: UserConfigType;
  mangoAccountValue: number;
  driftAccountValue: number;
  userUsdcBalance: number;
  driftFreeCollateral: number;
  mangoDailyFundingRateProfit: number;
  driftDailyFundingRateProfit: number;
};

const getAccountBalance = async (
  connection: Connection,
  userPkey: PublicKey
): Promise<number> => {
  const userUsdcAccount = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    USDC_MINT_KEY,
    userPkey
  );
  let userUsdcBalance: number | null = null;
  try {
    userUsdcBalance = (await connection.getTokenAccountBalance(userUsdcAccount))
      .value.uiAmount;
  } catch (e) {
    console.log('user has no money on account');
  }

  return userUsdcBalance || 0;
};

const getDriftFundingRateDayProfit = async (userDriftAccount: string) => {
  const cacheKey = `drift_24h_funding_rate_${userDriftAccount}`;
  const value = cache.get(cacheKey);
  if (value) {
    console.log('cache hit', cacheKey);
    return value;
  }
  console.log('cache miss', cacheKey);

  const stats = await (
    await fetch(
      `https://mainnet-beta.api.drift.trade/fundingRatePayments/userAccount/${userDriftAccount}?pageIndex=0&pageSize=100`
    )
  ).json();
  if (stats.success) {
    const minTime = new Date().getTime() / 1000 - 86400;
    let fundingReceived = new BN(0);
    for (const p of stats.data) {
      if (p.blockchainTs < minTime) {
        break;
      }
      fundingReceived = fundingReceived.add(new BN(p.amount));
    }

    const fundingRateFloat =
      fundingReceived.div(new BN('100000000000')).toNumber() / 100;
    cache.set(
      `drift_24h_funding_rate_${userDriftAccount}`,
      fundingRateFloat.toString(),
      300
    );
    return fundingRateFloat.toString();
  }
  return '0';
};

const getMangoFundingRatesDayProfit = async (userMangoAccount: string) => {
  const cacheKey = `mango_24h_funding_rate_${userMangoAccount}`;
  const value = cache.get(cacheKey);
  if (value) {
    console.log('cache hit', cacheKey);
    return value;
  }
  console.log('cache miss', cacheKey);

  const url = `https://mango-transaction-log.herokuapp.com/v3/stats/hourly-funding?mango-account=${userMangoAccount}`;
  const stats = await (await fetch(url)).json();
  let r = 0;
  const minDate = new Date().getTime() - 24 * 60 * 60 * 1000;

  for (const [_, fundings] of Object.entries(stats)) {
    for (const [dateStr, fundingObj] of Object.entries(fundings)) {
      const date = new Date(dateStr).getTime();
      if (date < minDate) {
        break;
      }
      r += fundingObj.total_funding;
    }
  }
  cache.set(cacheKey, r.toString(), 300);
  return r.toString();
};

const getMangoFundingRates = async (marketName: string) => {
  const cacheKey = `mango_funding_rates_${marketName}`;
  const value = cache.get(cacheKey);
  if (value) {
    console.log('cache hit', cacheKey);
    return value;
  }
  console.log('cache miss', cacheKey);

  const stats = await (
    await fetch(
      `https://mango-stats-v3.herokuapp.com/perp/funding_rate?mangoGroup=mainnet.1&market=${marketName}`
    )
  ).json();

  const newestStats = stats[0];
  const oldestStats = stats[stats.length - 1];
  const oldestShortFunding = parseFloat(oldestStats.shortFunding);
  const oldestLongFunding = parseFloat(oldestStats.longFunding);
  const newestShortFunding = parseFloat(newestStats.shortFunding);
  const newestLongFunding = parseFloat(newestStats.longFunding);
  const newestOraclePrice = parseFloat(newestStats.baseOraclePrice);
  const startFunding = (oldestLongFunding + oldestShortFunding) / 2;
  const endFunding = (newestLongFunding + newestShortFunding) / 2;
  const fundingDifference = endFunding - startFunding;

  const fundingRate = fundingDifference / newestOraclePrice / 100;
  cache.set(cacheKey, fundingRate, 300);
  return fundingRate;
};

const getMangoUserInfo = async (
  connection: Connection,
  mangoAccount: MangoAccount,
  mangoGroup: MangoGroup
) => {
  const cacheKey = `mango_user_info_${mangoAccount.publicKey.toString()}`;
  const value = cache.get(cacheKey);
  if (value) {
    console.log('cache hit', cacheKey);
    return value;
  }
  console.log('cache miss', cacheKey);

  const solPerpMarket = await mangoGroup.loadPerpMarket(connection, 3, 9, 6);
  const btcPerpMarket = await mangoGroup.loadPerpMarket(connection, 1, 6, 6);
  const avaxPerpMarket = await mangoGroup.loadPerpMarket(connection, 12, 8, 6);
  const lunaPerpMarket = await mangoGroup.loadPerpMarket(connection, 13, 6, 6);
  const mangoPositions = {
    'SOL-PERP': mangoAccount.getPerpPositionUi(3, solPerpMarket),
    'BTC-PERP': mangoAccount.getPerpPositionUi(1, btcPerpMarket),
    'AVAX-PERP': mangoAccount.getPerpPositionUi(12, avaxPerpMarket),
    'LUNA-PERP': mangoAccount.getPerpPositionUi(13, lunaPerpMarket),
    'ETH-PERP': mangoAccount.getPerpPositionUi(2, lunaPerpMarket),
  };
  const mangoAccountValue =
    mangoAccount.getEquityUi(
      mangoGroup,
      await mangoGroup.loadCache(connection)
    ) * 1000000;

  const r = { mangoPositions, mangoAccountValue };

  cache.set(cacheKey, r, 120);
  return r;
};

const getDriftUserInfo = async (
  connection: Connection,
  accountOwner: PublicKey
) => {
  const cacheKey = `drift_user_info_${accountOwner.toString()}`;
  const value = cache.get(cacheKey);
  if (value) {
    console.log('cache hit', cacheKey);
    return value;
  }
  console.log('cache miss', cacheKey);

  const clearingHouse = ClearingHouse.from(connection, null, DRIFT_PROGRAM_KEY);
  await clearingHouse.subscribe();
  const driftUser = ClearingHouseUser.from(clearingHouse, accountOwner);
  await driftUser.subscribe();
  const driftPositions = driftUser.getUserPositionsAccount().positions;
  const driftAccountValue = driftUser.getTotalCollateral().toNumber() / 1000000;
  const driftFreeCollateral =
    driftUser.getFreeCollateral().toNumber() / 1000000;

  const r = {
    driftPositions,
    driftAccountValue,
    driftFreeCollateral,
  };

  cache.set(cacheKey, r, 120);

  return r;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UserInfoData>
) {
  const { user } = req.query;
  const userPkey = new PublicKey(user.toString());

  const connection = new Connection(RPC_URL);

  const anchor = require('@project-serum/anchor');
  const PROGRAM_ID = BUTLER_PROGRAM_KEY;
  const provider = new anchor.Provider(connection, null);
  const program = (await anchor.Program.at(
    PROGRAM_ID,
    provider
  )) as Program<Butler>;

  const [mangoAccountPk, mangoAccountBump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode('mango_account_v1')),
        userPkey.toBuffer(),
      ],
      program.programId
    );
  const mangoAccountInfo = await connection.getAccountInfoAndContext(
    mangoAccountPk
  );
  const [accountOwner, accountOwnerBump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode('butler_account_owner_v1')),
        userPkey.toBuffer(),
      ],
      program.programId
    );
  const [userConfigPk, userConfigBump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode('butler_user_config_v1')),
        userPkey.toBuffer(),
      ],
      BUTLER_PROGRAM_KEY
    );

  const positionsUi = [];
  let userConfig: UserConfigType = {
    closeSpread: 0,
    mode: 0,
    openSpread: 0,
    tradeSize: 0,
    userCranker: undefined,
    userPubkey: undefined,
  };

  if (mangoAccountInfo.value == null) {
    res.status(200).json({
      driftAccountValue: undefined,
      mangoAccountValue: undefined,
      accountInitialized: false,
      butlerAccountOwner: undefined,
      mangoAccount: undefined,
      positionUi: [],
      userConfig: undefined,
    });
  }
  const userConfigData = await program.account.userConfig.fetch(userConfigPk);
  userConfig = userConfigData;
  const mangoClient = new MangoClient(connection, MANGO_PROGRAM_KEY);
  const mangoGroup = await mangoClient.getMangoGroup(MANGO_GROUP_CONFIG_KEY);
  const mangoAccount = await mangoClient.getMangoAccount(
    mangoAccountPk,
    MANGO_PROGRAM_KEY
  );

  const { mangoPositions, mangoAccountValue } = await getMangoUserInfo(
    connection,
    mangoAccount,
    mangoGroup
  );
  const mangoDailyFundingRateProfit = parseFloat(
    await getMangoFundingRatesDayProfit(mangoAccount.publicKey.toString())
  );

  console.log('mangoDailyFundingRateProfit', mangoDailyFundingRateProfit);

  const clearingHouse = ClearingHouse.from(connection, null, DRIFT_PROGRAM_KEY);
  await clearingHouse.subscribe();
  const driftUser = ClearingHouseUser.from(clearingHouse, accountOwner);
  await driftUser.subscribe();
  const driftDailyFundingRateProfit = parseFloat(
    await getDriftFundingRateDayProfit(
      (await driftUser.getUserAccountPublicKey()).toString()
    )
  );

  const { driftPositions, driftAccountValue, driftFreeCollateral } =
    await getDriftUserInfo(connection, accountOwner);

  /// calculate for funding revenue, apy etc.
  await Promise.all(
    driftPositions.map(async (p) => {
      let marketName = '';
      switch (p.marketIndex.toNumber()) {
        case 0:
          marketName = 'SOL';
          break;
        case 1:
          marketName = 'BTC';
          break;
        case 2:
          marketName = 'ETH';
          break;
        case 3:
          marketName = 'LUNA';
          break;
        case 4:
          marketName = 'AVAX';
          break;
      }
      const marketNamePerp = `${marketName}-PERP`;
      const driftQuote = p.quoteAssetAmount.toNumber() / 1000000;
      if (driftQuote === 0) {
        return;
      }

      console.log('getting', marketNamePerp);
      const mangoFundingRate =
        (await getMangoFundingRates(marketNamePerp)) * 24 * 365;

      const driftBase =
        p.baseAssetAmount.div(new BN('10000000000')).toNumber() / 1000;
      const isDriftLong = driftBase > 0;
      const market = clearingHouse.getMarket(p.marketIndex);
      const marketTwap = market.amm.lastMarkPriceTwap
        .div(new BN('10000'))
        .toNumber();

      const oracleTwap = market.amm.lastOraclePriceTwap
        .div(new BN('10000'))
        .toNumber();
      const driftFundingRate =
        ((marketTwap - oracleTwap) / oracleTwap) * 100 * (1 / 24) * 24 * 365;

      const driftFundingMultiplier = isDriftLong ? -1 : 1;
      const driftFundingRev =
        (driftQuote * driftFundingRate * driftFundingMultiplier) /
        100 /
        24 /
        365;
      const mangoFundingRev =
        (driftQuote * mangoFundingRate * driftFundingMultiplier * -1) /
        100 /
        24 /
        365;
      const estFundingRev = driftFundingRev + mangoFundingRev;
      const fundingRateSum =
        driftFundingRate * driftFundingMultiplier +
        mangoFundingRate * driftFundingMultiplier * -1;
      const estApr =
        (fundingRateSum * driftQuote) / (driftAccountValue + mangoAccountValue);
      positionsUi.push({
        marketNamePerp,
        driftQuote,
        driftBase,
        mangoBase: mangoPositions[marketNamePerp],
        isDriftLong,
        driftFundingRate,
        mangoFundingRate,
        estFundingRev,
        estApr,
      });
    })
  );

  const userUsdcBalance = await getAccountBalance(connection, userPkey);

  console.log('user usdc balance', userUsdcBalance);
  await clearingHouse.unsubscribe();
  await driftUser.unsubscribe();

  const r = {
    accountInitialized: true,
    mangoAccount: mangoAccountPk,
    positionUi: positionsUi,
    butlerAccountOwner: accountOwner,
    userConfig,
    mangoAccountValue,
    driftAccountValue,
    userUsdcBalance,
    driftFreeCollateral,
    mangoDailyFundingRateProfit,
    driftDailyFundingRateProfit,
  };

  res.status(200).json(r);
}
