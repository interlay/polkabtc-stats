export interface Issue {
    id: string;
    amountBTC: string;
    requester: string;
    feePolkabtc: string;
    griefingCollateral: string;
    vaultWalletPubkey: string;
    creation: string;
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
