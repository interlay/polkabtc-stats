export interface Redeem {
    id: string;
    amountPolkaBTC: string;
    creation: string;
    vaultDotAddress: string;
    btcAddress: string;
    btcTxId: string;
    confirmations: number;
    completed: boolean;
    cancelled: boolean;
    reimbursed: boolean;
    isExpired: boolean;
};