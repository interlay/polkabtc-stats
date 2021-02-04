export interface Issue {
    id: string;
    amountBTC: string;
    creation: string;
    timestamp: string;
    vaultBTCAddress: string;
    vaultDOTAddress: string;
    btcTxId: string;
    confirmations: number;
    completed: boolean;
    cancelled: boolean;
};
