import {DistributionStats} from "../common/commonModels";

export interface Issue {
    id: string;
    amountBTC: string;
    requester: string;
    feePolkabtc: string;
    griefingCollateral: string;
    vaultWalletPubkey: string;
    creation: number;
    timestamp: string;
    vaultBTCAddress: string;
    vaultDOTAddress: string;
    btcTxId: string;
    confirmations?: number;
    btcBlockHeight: number;
    completed: boolean;
    cancelled: boolean;
    executedAmountBTC: string;
    requestedRefund: boolean;
    refundBtcAddress: string;
    refundAmountBTC: string;
}

export interface IssueStats {
    totalRequests: number;
    totalSuccesses: number;
    totalPolkaBTCIssued: string;
    averageRequest: DistributionStats;
}
