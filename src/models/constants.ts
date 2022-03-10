
import {PublicKey} from "@solana/web3.js";

export const RPC_URL = "https://solana--mainnet.datahub.figment.io/apikey/1439fe679592c7006d0698182ed300fe/"
export const MANGO_PROGRAM_KEY = new PublicKey("mv3ekLzLbnVPNxjSKvqBpU3ZeZXPQdEC3bp5MDEBG68")
export const MANGO_GROUP_CONFIG_KEY = new PublicKey("98pjRuQjK3qA6gXts96PqZT4Ze5QmnCmt3QYjhbUSPue")
export const USDC_MINT_KEY = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")
export const DRIFT_PROGRAM_KEY = new PublicKey("dammHkt7jmytvbS3nHTxQNEcP59aE57nxwV21YdqEDN")
export const DRIFT_STATE_KEY = new PublicKey("FExhvPycCCwYnZGeDsVtLhpEQ3yEkVY2k1HuPyfLj91L")
export const BUTLER_PROGRAM_KEY = new PublicKey("86pSXTcTkDSr7QkaRyfyS6K9n5ZVw1cz1unS3o9tbYEX")
export const MANGO_USDC_ROOT_KEY = new PublicKey("AMzanZxMirPCgGcBoH9kw4Jzi9LFMomyUCXbpzDeL2T8")
export const MANGO_USDC_NODE_KEY = new PublicKey("BGcwkj1WudQwUUjFk78hAjwd1uAm8trh1N4CJSa51euh")
export const MANGO_CACHE_KEY = new PublicKey("EBDRoayCDDUvDgCimta45ajQeXbexv7aKqJubruqpyvu")
export const MANGO_USDC_VAULT = new PublicKey("8Vw25ZackDzaJzzBBqcgcpDsCsDfRSkMGgwFQ3gbReWF")
export const MANGO_SIGNER_KEY = new PublicKey("9BVcYqEQxyccuwznvxXqDkSJFavvTyheiTYk231T1A8S")

export type MangoDriftConfig = {
    driftIndex: number,
    mangoIndex: number,
    pythOracle: PublicKey,
    mangoPerpMarketKey: PublicKey,
    mangoBidKey: PublicKey,
    mangoAskKey: PublicKey,
    eventsKey: PublicKey,
    toMangoBaseUnitMultiplier: number
}


export const MANGO_DRFIT_CONFIG = {
    'SOL-PERP': {
        driftIndex: 0,
        mangoIndex: 3,
        pythOracle: new PublicKey("H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG"),
        mangoPerpMarketKey: new PublicKey("2TgaaVoHgnSeEtXvWTx13zQeTf4hYWAMEiMQdcG6EwHi"),
        mangoBidKey: new PublicKey("Fu8q5EiFunGwSRrjFKjRUoMABj5yCoMEPccMbUiAT6PD"),
        mangoAskKey: new PublicKey("9qUxMSWBGAeNmXusQHuLfgSuYJqADyYoNLwZ63JJSi6V"),
        eventsKey: new PublicKey("31cKs646dt1YkA3zPyxZ7rUAkxTBz279w4XEobFXcAKP"),
        toMangoBaseUnitMultiplier: 100
    } as MangoDriftConfig,
    'BTC-PERP': {
        driftIndex: 1,
        mangoIndex: 1,
        pythOracle: new PublicKey("GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU"),
        mangoPerpMarketKey: new PublicKey("DtEcjPLyD4YtTBB4q8xwFZ9q49W89xZCZtJyrGebi5t8"),
        mangoBidKey: new PublicKey("Bc8XaK5UTuDSCBtiESSUxBSb9t6xczhbAJnesPamMRir"),
        mangoAskKey: new PublicKey("BkWRiarqxP5Gwx7115LQPbjRmr3NjuSRXWBnduXXLGWR"),
        eventsKey: new PublicKey("7t5Me8RieYKsFpfLEV8jnpqcqswNpyWD95ZqgUXuLV8Z"),
        toMangoBaseUnitMultiplier: 10000

    }as MangoDriftConfig,
    'AVAX-PERP': {
        driftIndex: 4,
        mangoIndex: 12,
        pythOracle: new PublicKey("Ax9ujW5B9oqcv59N8m6f1BpTBq2rGeGaBcpKjC5UYsXU"),
        mangoPerpMarketKey: new PublicKey("EAC7jtzsoQwCbXj1M3DapWrNLnc3MBwXAarvWDPr2ZV9"),
        mangoBidKey: new PublicKey("BD1vpQjLXx7Rmd5n1SFNTLcwujPYTnFpoaArvPd9ixB9"),
        mangoAskKey: new PublicKey("8Q11iGHXFTr267J4bgbeEeWPYPSANVcs6NQWHQK4UrNs"),
        eventsKey: new PublicKey("5Grgo9kLu692SUcJ6S7jtbi1WkdwiyRWgThAfN1PcvbL"),
        toMangoBaseUnitMultiplier: 100

    } as MangoDriftConfig,
    'LUNA-PERP': {
        driftIndex: 3,
        mangoIndex: 13,
        pythOracle: new PublicKey("5bmWuR1dgP4avtGYMNKLuxumZTVKGgoN2BCMXWDNL9nY"),
        mangoPerpMarketKey: new PublicKey("BCJrpvsB2BJtqiDgKVC4N6gyX1y24Jz96C6wMraYmXss"),
        mangoBidKey: new PublicKey("AiBurBkETJHHujZxNHm6UPvBQ1LLLkNkckPoZLeuLnS1"),
        mangoAskKey: new PublicKey("7Vcbxj2M8fqaNGfRDsau47uXumfCBhCTA97D6PNDPWfe"),
        eventsKey: new PublicKey("HDJ43o9Dxxu6yWRWPEce44gtCHauRGLXJwwtvD7GwEBx"),
        toMangoBaseUnitMultiplier: 100
    } as MangoDriftConfig,
    'ETH-PERP': {
        driftIndex: 2,
        mangoIndex: 2,
        pythOracle: new PublicKey("JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB"),
        mangoPerpMarketKey: new PublicKey("DVXWg6mfwFvHQbGyaHke4h3LE9pSkgbooDSDgA4JBC8d"),
        mangoBidKey: new PublicKey("DQv2sWhaHYbKrobHH6jAdkAXw13mnDdM9hVfRQtrUcMe"),
        mangoAskKey: new PublicKey("8NhLMV6huneGAqijuUgUFSshbAfXxdNj6ZMHSLb9aW8K"),
        eventsKey: new PublicKey("9vDfKNPJkCvQv9bzR4JNTGciQC2RVHPVNMMHiVDgT1mw"),
        toMangoBaseUnitMultiplier: 1000
    } as MangoDriftConfig

}


export const WHITELIST_PUBKEY = [
    "DeezaMBrkEXxPxQvFdN8N3tjUTZdbDkbCcPjLNvB5FGw",
    "7WFtrHFYwYwTGDnEMnWb2YYSCaQk2jc6JXLJvdbmqMMr",
    "set1kBe5zQXMPcYgFBQwGiyW97eu5ddZ38sVUXB7Nds",
    "2hCS9ArjW6NBhTDo9t8MU4U4wmSsa4v2s87NjvnvX9gQ",
    "CYJ41oyY9eKJmhwxDxK583KEyGHxXxYh1CnhudMn33RD",
    "Cx5FdZD8472QfpxCHEeK8Ca8LaHGfsuoruV5PukeRjYb",
    "GDvfwuytQuzKZFqdwnJoRnssAnqbbQ9Hqr2tZXb5bXM6",
    "4vJWNsRmcdZ4weG6xYCJupxdPaUUUaqLgumMhRc2jBv8",
    "GU2CEG4UxxaqNuauRZFMBWjxCHYtGzXMo4UpGoKUtigb",
    "7RKkea2jZQDRiDP6E26SYFXmyTvGzgXJWEQNdJcgRp1D",
    "NyFifTVRQXZ5LKiAAdqiN9jMjWM9BkRiAx3iWeZHmSs",
    "8vyLuohvz5H9de9LxAort4BvFPDFsrEyTkM7Kmq1a4Fc",
    "CzGtr4axSfWrFJcJ4Vk3KPhfqiaA2iuYbUmm1r365odk",
    "64aioWkKqxraFCvy4rLcgYA2LfoVgzGPrEdhKpcW1ppM",
    "6dRjjYDZVwt26ziqW5hvLmkXNrvACJaUv2cWtrA6ky7x",
    "GQmAKyJBTjDhfECzSTj2n2URTPcEeSMErUxAEg2DpEEK",
    "2dsEkAXA6M1MTCGyrFVrZdVkE8ooX5NXhFXeAk3C3gHt",
    "9EMbvF14vFb1YVPDrzS9DV8mL6xxkL6oxBvGRk64hekQ",
    "Emz9HwYpt8RdRmf2PKRWhNAiYqv4j2ANx4eKF3Bu24rs",
    "86LbAEnwSx41YQpkLX48CWQNqVRnFwRNXtNJWeGDX5Z8",
    "HrUr1pRxqXJ72RaSSdv4GXbRWLW32EWgjEtt6uiaQp9v",
    "6NTbCkLyLZ8bU7wmCMd3AFU3FLMMqFSBRgg2qHPnKj6X",
    "BWMBJwmcKv7gDGx9Be1oZqmKhb2JhPxcxvBxErZGCaV1",
    "B7sPQhKSvAzArvU41QAcc8a1m6TWbGBryEuLKfWgoXe9",
    "CWjWW9stkWBVyUT2C1P2VoW5ykM6WXvfTscausPxQLWU",
    "FUozyX3anCrP2ECFsdosRF9rvVr6LqYLjNMyzsdK3LZ",
    "Eze21BxGyxEDWTnYipXu2HveJYwSDa9uGUvpDVsPUNTC",
    "8MysJK4f7LFnrZKPgbDrMjf2Jrwjh8vrozav24qtKYoR",
    "CGE34jY414WZyBMMb76a5ziWrAHnXwaxLwUSBnuvYdzg",
    "5sBpMQgTi7phxqRnErfbwx29vUsbUZoy1MLgY7aXuqeo",
    "5AaFBQmUpEtBkCBNpa1jv28q44EnB2nP5CRejHQCoBSc",
    "Gyfp12eAkPSw8MUcMcNH4EpHoZYoGs85Jg6tMsewxqYE"
]
