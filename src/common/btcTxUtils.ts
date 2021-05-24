import {PolkaBTCAPI} from "@interlay/polkabtc";
import { getRepository } from "typeorm";
import { RequestTxCache } from "../models/RequestTxCache";
import { getPolkaBtc } from "./polkaBtc";
import logFn from '../common/logger'

export const logger = logFn({ name: 'btcTxUtils' });

export type TxDetails = {
    txid: string;
    blockHeight: number;
    confirmations?: number;
};

export enum RequestType {
    Redeem,
    Issue,
}

//bootleg memoization
const getStableConfs: () => Promise<number> = (() => {
    let stableConfs: number | undefined;
    return async () => {
        if (stableConfs === undefined) {
            const polkabtc = await getPolkaBtc();
            stableConfs = await polkabtc.btcRelay.getStableBitcoinConfirmations();
        }
        return stableConfs;
    };
})();

async function getConfirmationsForTxid(polkabtc: PolkaBTCAPI, txid: string) {
    const txStatus = await polkabtc.electrsAPI.getTransactionStatus(txid);
    return txStatus.confirmations;
}

export async function getTxDetailsForRequest(
    requestId: string,
    requestType: RequestType,
    recipient: string,
    useOpReturn?: boolean,
    amountBtc?: string
): Promise<TxDetails> {
    const stableConfs = await getStableConfs();
    const polkabtc = await getPolkaBtc();

    const amountBtcBig = amountBtc ? new Big(amountBtc) : undefined;

    const savedDetails = (
        await getRepository(RequestTxCache, "pg_replica").find({
            id: requestId,
            request_type: requestType,
        })
    )[0];
    if (savedDetails === undefined) {
        // no details yet, fetch everything from esplora
        logger.debug(`No BTC details yet for ${requestId} (type ${requestType})`);
        try {
            const txid = await (useOpReturn
                ? polkabtc.electrsAPI.getTxIdByOpReturn(
                    requestId.substring(2),
                    recipient,
                    amountBtcBig
                )
                : polkabtc.electrsAPI.getTxIdByRecipientAddress(
                    recipient,
                    amountBtcBig
                ));
            const confirmations = await getConfirmationsForTxid(polkabtc, txid);
            const blockHeight =
                (await polkabtc.electrsAPI.getTransactionBlockHeight(txid)) || 0;

            getRepository(RequestTxCache).save({
                id: requestId,
                request_type: requestType,
                txid,
                confirmations,
                block_height: blockHeight,
            });
            logger.trace(`For request ${requestId}, returning ${txid}, ${blockHeight}, ${confirmations}`);
            return { txid, blockHeight, confirmations };
        } catch (e) {
            logger.trace(`For request ${requestId}, returning txid "", blockHeight 0, no confirmations`);
            logger.info({ err: e, requestId: requestId }, `Failed to get BTC tx data for ${requestId} (probably no tx has been broadcast yet)`);
            return { txid: "", blockHeight: 0 };
        }
    } else if (
        savedDetails.confirmations < stableConfs ||
        savedDetails.block_height === 0
    ) {
        // txid known, but tx not known to be confirmed, update confirmations
        logger.debug(`Existing details found for ${requestId}, but confirmations not final yet`);
        try {
            const confirmations = await getConfirmationsForTxid(polkabtc, savedDetails.txid);
            const blockHeight =
                (await polkabtc.electrsAPI.getTransactionBlockHeight(savedDetails.txid)) || 0;

            getRepository(RequestTxCache).save({
                ...savedDetails,
                blockHeight,
                confirmations,
            });
            logger.trace(`For request ${requestId}, returning ${savedDetails.txid}, ${blockHeight}, ${confirmations}`);
            return {
                txid: savedDetails.txid,
                confirmations,
                blockHeight,
            };
        } catch (e) {
            logger.trace(`For request ${requestId}, returning ${savedDetails.txid}, blockHeight 0, no confirmations`);
            logger.warn({ err: e, requestId: requestId }, `Failed to get BTC confirmations for ${requestId} (but tx should already exist with id: ${savedDetails.txid}`);
            return { txid: savedDetails.txid, blockHeight: 0 };
        }
    } else {
        logger.debug(`Using only cached BTC details for ${requestId} as tx is securely confirmed`);
        // tx known confirmed, pass block_height to let client display confirmations
        logger.trace(`For request ${requestId}, returning ${savedDetails.txid}, ${savedDetails.block_height}, no confirmations`);
        return {
            txid: savedDetails.txid,
            confirmations: undefined,
            blockHeight: savedDetails.block_height,
        };
    }
}
