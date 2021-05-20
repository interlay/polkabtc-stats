import { PolkaBTCAPI } from "@interlay/polkabtc";
import { getPolkaBtc } from "./polkaBtc";
import logFn from "../common/logger";
import pool from "../common/pool";

export const logger = logFn({ name: "btcTxUtils" });

export type TxDetails = {
    txid: string;
    blockHeight: number;
    confirmations?: number;
};

type CachedDetails = {
    id: string;
    request_type: RequestType;
    txid: string;
    block_height: number;
    confirmations: number;
};

export enum RequestType {
    Redeem,
    Issue,
}

async function getConfirmationsForTxid(polkabtc: PolkaBTCAPI, txid: string) {
    const txStatus = await polkabtc.btcCore.getTransactionStatus(txid);
    return txStatus.confirmations;
}

export async function getTxDetailsForRequest(
    requestId: string,
    requestType: RequestType,
    recipient: string,
    useOpReturn?: boolean,
    amountBtc?: string
): Promise<TxDetails> {
    const stableConfs = 1; // TODO: this will be changed as soon as the constants API gets in
    const savedDetailRows = (
        await pool.query(
            `SELECT * FROM request_tx_cache WHERE id = $1 AND request_type = $2`,
            [requestId, requestType]
        )
    ).rows;
    if (savedDetailRows.length > 1) {
        logger.error(
            `Request ${requestId} has more than one row of cached TX details`
        );
    }
    const savedDetails: CachedDetails | undefined = savedDetailRows[0];

    if (savedDetails === undefined) {
        // no details yet, fetch everything from esplora
        try {
            return getAndCacheTxDetailsFromLib(
                requestId,
                requestType,
                recipient,
                useOpReturn,
                amountBtc
            );
        } catch (e) {
            logger.info(
                { err: e, requestId: requestId },
                `Failed to get BTC tx data for ${requestId} (probably no tx has been broadcast yet)`
            );
            return { txid: "", blockHeight: 0 };
        }
    } else if (
        savedDetails.confirmations < stableConfs ||
        savedDetails.block_height === 0
    ) {
        // txid known, but tx not known to be confirmed, update confirmations
        try {
            return updateCacheConfirmationsFromLib(savedDetails);
        } catch (e) {
            logger.warn(
                { err: e, requestId: requestId },
                `Failed to get BTC confirmations for ${requestId} (but tx should already exist with id: ${savedDetails.txid}`
            );
            return { txid: savedDetails.txid, blockHeight: 0 };
        }
    } else {
        logger.debug(
            `Using only cached BTC details for ${requestId} as tx is securely confirmed`
        );
        // tx known confirmed, pass block_height to let client calculate confirmations
        return {
            txid: savedDetails.txid,
            confirmations: undefined,
            blockHeight: savedDetails.block_height,
        };
    }
}

async function getAndCacheTxDetailsFromLib(
    requestId: string,
    requestType: RequestType,
    recipient: string,
    useOpReturn?: boolean,
    amountBtc?: string
): Promise<TxDetails> {
    const polkabtc = await getPolkaBtc();
    const txid = await (useOpReturn
        ? polkabtc.btcCore.getTxIdByOpReturn(
              requestId.substring(2),
              recipient,
              amountBtc
          )
        : polkabtc.btcCore.getTxIdByRecipientAddress(recipient, amountBtc));
    const confirmations = await getConfirmationsForTxid(polkabtc, txid);
    const blockHeight =
        (await polkabtc.btcCore.getTransactionBlockHeight(txid)) || 0;

    await pool.query(
        `
        INSERT INTO request_tx_cache
            (id, request_type, txid, block_height, confirmations)
            VALUES ($1, $2, $3, $4, $5)
        `,
        [requestId, requestType, txid, blockHeight, confirmations]
    );

    logger.trace(
        `For request ${requestId}, returning ${txid}, ${blockHeight}, ${confirmations}`
    );
    return { txid, blockHeight, confirmations };
}

async function updateCacheConfirmationsFromLib(
    savedDetails: CachedDetails
): Promise<TxDetails> {
    const polkabtc = await getPolkaBtc();
    const confirmations = await getConfirmationsForTxid(
        polkabtc,
        savedDetails.txid
    );
    const blockHeight =
        (await polkabtc.btcCore.getTransactionBlockHeight(savedDetails.txid)) ||
        0;

    await pool.query(
        `
        UPDATE request_tx_cache
            SET block_height = $1, confirmations = $2
            WHERE id = $3 AND request_type = $4
        `,
        [blockHeight, confirmations, savedDetails.id, savedDetails.request_type]
    );
    logger.trace(
        `For request ${savedDetails.id}, returning ${savedDetails.txid}, ${blockHeight}, ${confirmations}`
    );
    return {
        txid: savedDetails.txid,
        confirmations,
        blockHeight,
    };
}
