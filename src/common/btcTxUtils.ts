import {PolkaBTCAPI} from "@interlay/polkabtc";
import { getRepository } from "typeorm";
import { RequestTxCache } from "../models/RequestTxCache";
import { getPolkaBtc } from "./polkaBtc";

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
        if (requestType === RequestType.Redeem) {
            console.log(`No details yet for ${requestId}`);
        }
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
            const confirmations = await getConfirmationsForTxid(polkabtc, txid);
            const blockHeight =
                (await polkabtc.btcCore.getTransactionBlockHeight(txid)) || 0;

            getRepository(RequestTxCache).save({
                id: requestId,
                request_type: requestType,
                txid,
                confirmations,
                block_height: blockHeight,
            });
            if (requestType === RequestType.Redeem) {
                console.log(`Returning ${txid}, ${blockHeight}, ${confirmations}`);
            }
            return { txid, blockHeight, confirmations };
        } catch (e) {
            console.log(`Failed to get BTC tx data for ${requestId}:`);
            if (requestType === RequestType.Redeem) {
                console.log(`Returning txid "", blockHeight 0, no confirmations`);
            }
            return { txid: "", blockHeight: 0 };
        }
    } else if (
        savedDetails.confirmations < stableConfs ||
        savedDetails.block_height === 0
    ) {
        if (requestType === RequestType.Redeem) {
            console.log(`Existing details yet for ${requestId}, but not fully confirmed yet`);
        }
        // txid known, but tx not known to be confirmed, update confirmations
        try {
            const confirmations = await getConfirmationsForTxid(polkabtc, savedDetails.txid);
            const blockHeight =
                (await polkabtc.btcCore.getTransactionBlockHeight(savedDetails.txid)) || 0;

            getRepository(RequestTxCache).save({
                ...savedDetails,
                blockHeight,
                confirmations,
            });
            if (requestType === RequestType.Redeem) {
                console.log(`Returning ${savedDetails.txid}, ${blockHeight}, ${confirmations}`);
            }
            return {
                txid: savedDetails.txid,
                confirmations,
                blockHeight,
            };
        } catch (e) {
            console.log(`Failed to get BTC confirmations for ${requestId}:`);
            if (requestType === RequestType.Redeem) {
                console.log(`Returning ${savedDetails.txid}, blockHeight 0, no confirmations`);
            }
            return { txid: savedDetails.txid, blockHeight: 0 };
        }
    } else {
        if (requestType === RequestType.Redeem) {
            console.log(`Using only cache for ${requestId}`);
        }
        // tx known confirmed, pass block_height to let client display confirmations
        if (requestType === RequestType.Redeem) {
            console.log(`Returning ${savedDetails.txid}, ${savedDetails.block_height}, no confirmations`);
        }
        return {
            txid: savedDetails.txid,
            confirmations: undefined,
            blockHeight: savedDetails.block_height,
        };
    }
}
