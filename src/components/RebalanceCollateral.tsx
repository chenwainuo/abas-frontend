import {useConnection, useWallet} from '@solana/wallet-adapter-react';
import {PublicKey, Transaction, TransactionSignature} from '@solana/web3.js';
import {FC, useCallback} from 'react';
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
import {ClearingHouse, ClearingHouseUser} from '@drift-labs/sdk';
import {MangoClient} from "@blockworks-foundation/mango-client";

export type DepositUSDCProps = {
    show: boolean,
    mangoAccount: PublicKey
    butlerAccountOwner: PublicKey
}

export const RebalanceCollateral: FC<DepositUSDCProps> = (props) => {
    const {connection} = useConnection();
    const {publicKey, sendTransaction, wallet} = useWallet();


    const onClick = useCallback(async () => {
        if (!publicKey) {
            notify({type: 'error', message: `Wallet not connected!`});
            console.log('error', `Send Transaction: Wallet not connected!`);
            return;
        }
        try {
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

            const clearingHouse = ClearingHouse.from(
                connection,
                null,
                DRIFT_PROGRAM_KEY
            );
            await clearingHouse.subscribe()
            const driftUser = ClearingHouseUser.from(clearingHouse, accountOwner)
            await driftUser.subscribe()

            const clearingHouseState = clearingHouse.getStateAccount();
            const driftUserData = await clearingHouse.program.account.user.fetch(driftAccountPk.toString())
            const clearingHouseUserPositions = driftUserData.positions


            const provider = new anchor.Provider(connection, wallet);
            const program = await anchor.Program.at(BUTLER_PROGRAM_KEY, provider) as Program<Butler>

            const mangoClient = new MangoClient(connection, MANGO_PROGRAM_KEY);
            const mangoGroup = await mangoClient.getMangoGroup(MANGO_GROUP_CONFIG_KEY)
            const rootBanks = await mangoGroup.loadRootBanks(connection);
            const usdcRootBank = rootBanks.filter(v => v && v.publicKey.toString() === MANGO_USDC_ROOT_KEY.toString())[0]
            const mangoVault = usdcRootBank.nodeBankAccounts[0].vault


            const mangoAccount = await mangoClient.getMangoAccount(mangoAccountPk, MANGO_PROGRAM_KEY)
            const driftValues = driftUser.getTotalCollateral().toNumber() / 1_000_000
            const mangoCache = await mangoGroup.loadCache(connection)
            const mangoValues = mangoAccount.computeValue(mangoGroup, mangoCache).toNumber()
            const total = mangoValues + driftValues

            let mangoToDrift = (mangoValues - (total * 0.5)) / 5
            let driftToMango = (driftValues - (total * 0.5)) / 5
            const quantityNative = new anchor.BN(Math.max(mangoToDrift, driftToMango) * 10 ** 6)

            const [butlerDriftCollateralVault, butlerDriftCollateralBump] = await anchor.web3.PublicKey.findProgramAddress(
                [Buffer.from(anchor.utils.bytes.utf8.encode("butler_drift_collateral_vault_v1")), publicKey.toBuffer()],
                BUTLER_PROGRAM_KEY
            )
            const [clearingHouseCollateralVault, _bump] = await PublicKey.findProgramAddress(
                [Buffer.from(anchor.utils.bytes.utf8.encode('collateral_vault'))],
                new PublicKey(clearingHouse.program.programId)
            );

            const userMangoCollateralAccount = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, USDC_MINT_KEY, publicKey)
            const [butlerMangoCollateralVault, butlerMangoCollateralBump] = await anchor.web3.PublicKey.findProgramAddress(
                [Buffer.from(anchor.utils.bytes.utf8.encode("butler_mango_collateral_vault_v1")), publicKey.toBuffer()],
                BUTLER_PROGRAM_KEY
            )

            const clearingHouseCollateralVaultAuthority = clearingHouseState.collateralVaultAuthority
            const clearingHouseInsuranceVault = clearingHouseState.insuranceVault
            const clearingHouseInsuranceVaultAuthority = clearingHouseState.insuranceVaultAuthority

            const withdrawIx = program.instruction.withdrawMangoCollateral(stateBump, mangoAccountBump, accountOwnerBump, butlerMangoCollateralBump, butlerDriftCollateralBump, quantityNative, false, {
                accounts: {
                    state: state,
                    userMangoCollateralAccount: userMangoCollateralAccount,
                    butlerDriftCollateralVault: butlerDriftCollateralVault,
                    butlerMangoCollateralVault: butlerMangoCollateralVault,
                    butlerAccountOwner: accountOwner,
                    mangoProgram: MANGO_PROGRAM_KEY,
                    mangoGroupAi: mangoGroup.publicKey,
                    mangoAccountPk: mangoAccountPk,
                    mangoCacheAi: mangoGroup.mangoCache,
                    rootBankAi: MANGO_USDC_ROOT_KEY,
                    nodeBankAi: MANGO_USDC_NODE_KEY,
                    vaultAi: mangoVault,
                    emptyAccountAi: PublicKey.default,
                    mangoVaultSigner: mangoGroup.signerKey,
                    signer: publicKey,
                    butlerUserPubkey: publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID
                }
            })

            const depositIx = await program.instruction.depositCollateral(stateBump, accountOwnerBump, butlerDriftCollateralBump, butlerMangoCollateralBump, quantityNative, false, {
                accounts: {
                    state: state,
                    userDriftCollateralAccount: userMangoCollateralAccount,
                    userMangoCollateralAccount: userMangoCollateralAccount,
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

            const depositMangoCollateralIx = program.instruction.depositMangoCollateral(stateBump, mangoAccountBump, accountOwnerBump, butlerMangoCollateralBump, butlerDriftCollateralBump, quantityNative, false, {
                accounts: {
                    state: state,
                    userMangoCollateralAccount: userMangoCollateralAccount,
                    butlerDriftCollateralVault: butlerDriftCollateralVault,
                    butlerMangoCollateralVault: butlerMangoCollateralVault,
                    butlerAccountOwner: accountOwner,
                    mangoProgram: MANGO_PROGRAM_KEY,
                    mangoGroupAi: mangoGroup.publicKey,
                    mangoAccountPk: mangoAccountPk,
                    mangoCacheAi: mangoGroup.mangoCache,
                    rootBankAi: usdcRootBank.publicKey,
                    nodeBankAi: usdcRootBank.nodeBanks[0],
                    vaultAi: mangoVault,
                    signer: publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID
                }
            })

            const withdrawDriftCollateralIx = await program.instruction.withdrawDriftCollateral(stateBump, accountOwnerBump, butlerDriftCollateralBump, butlerMangoCollateralBump, quantityNative, false, {
                accounts: {
                    state: state,
                    userDriftCollateralAccount: userMangoCollateralAccount,
                    userMangoCollateralAccount: userMangoCollateralAccount,
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
                    clearingHouseCollateralVaultAuthority,
                    clearingHouseInsuranceVault,
                    clearingHouseInsuranceVaultAuthority,
                    clearingHouseProgram: clearingHouse.program.programId,
                    signer: publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID
                },
            })


            const txn = new Transaction()
            if (mangoValues > driftValues) {
                txn.add(withdrawIx).add(depositIx)

            }
            if (driftValues > mangoValues) {
                txn.add(withdrawDriftCollateralIx).add(depositMangoCollateralIx)
            }

            console.log(txn)
            let signature: TransactionSignature = '';
            try {
                signature = await sendTransaction(txn, connection);
                console.log("signature", signature)
                await connection.confirmTransaction(signature, 'confirmed');
                notify({type: 'success', message: 'Transaction successful!', txid: signature});
            } catch (error: any) {
                notify({type: 'error', message: `Transaction failed!`, description: error?.message, txid: signature});
                console.log('error', `Transaction failed! ${error?.message}`, signature);
                return;
            }
        } catch (e) {
            console.log(e)
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
                <span> Rebalance Collateral </span>
            </button>
        </div>
    );
};
