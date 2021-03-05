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

export async function getTxDetailsForRequest(
    requestId: string,
    requestType: RequestType,
    recipient: string,
    useOpReturn?: boolean,
    amountBtc?: string
): Promise<TxDetails> {
    const stableConfs = await getStableConfs();
    const polkabtc = await getPolkaBtc();

    const savedDetails = (
        await getRepository(RequestTxCache).find({
            id: requestId,
            request_type: requestType,
        })
    )[0];
    if (savedDetails === undefined) {
        // no details yet, fetch everything from esplora
        try {
            const txid = await (useOpReturn
                ? polkabtc.btcCore.getTxIdByOpReturn(
                      requestId.substring(2),
                      recipient,
                      amountBtc
                  )
                : polkabtc.btcCore.getTxIdByRecipientAddress(
                      recipient,
                      amountBtc
                  ));
            const confirmations = (
                await polkabtc.btcCore.getTransactionStatus(txid)
            ).confirmations;
            const blockHeight =
                (await polkabtc.btcCore.getTransactionBlockHeight(txid)) || 0;

            getRepository(RequestTxCache).save({
                id: requestId,
                request_type: requestType,
                txid,
                confirmations,
                block_height: blockHeight,
            });
            return { txid, blockHeight, confirmations };
        } catch (e) {
            logger.warn({ err: e, requestId: requestId }, `Failed to get BTC tx data for ${requestId}`);
            return { txid: "", blockHeight: 0 };
        }
    } else if (
        savedDetails.confirmations < stableConfs ||
        savedDetails.block_height === 0
    ) {
        // txid known, but tx not known to be confirmed, update confirmations
        try {
            const confirmations = (
                await polkabtc.btcCore.getTransactionStatus(savedDetails.txid)
            ).confirmations;
            const blockHeight =
                (await polkabtc.btcCore.getTransactionBlockHeight(savedDetails.txid)) || 0;

            getRepository(RequestTxCache).save({
                ...savedDetails,
                confirmations,
            });
            return {
                txid: savedDetails.txid,
                confirmations,
                blockHeight,
            };
        } catch (e) {
            logger.warn({ err: e, requestId: requestId }, `Failed to get BTC confirmations for ${requestId}`);
            return { txid: savedDetails.txid, blockHeight: 0 };
        }
    } else {
        // tx known confirmed, pass block_height to let client display confirmations
        return {
            txid: savedDetails.txid,
            confirmations: undefined,
            blockHeight: savedDetails.block_height,
        };
    }
}
