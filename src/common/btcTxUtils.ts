import {PolkaBTCAPI} from "@interlay/polkabtc";
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
    const polkabtc = await getPolkaBtc();

    // no details yet, fetch everything from esplora
    logger.debug(`No BTC details yet for ${requestId} (type ${requestType})`);
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

        logger.trace(`For request ${requestId}, returning ${txid}, ${blockHeight}, ${confirmations}`);
        return { txid, blockHeight, confirmations };
    } catch (e) {
        logger.trace(`For request ${requestId}, returning txid "", blockHeight 0, no confirmations`);
        logger.info({ err: e, requestId: requestId }, `Failed to get BTC tx data for ${requestId} (probably no tx has been broadcast yet)`);
        return { txid: "", blockHeight: 0 };
    }
}
