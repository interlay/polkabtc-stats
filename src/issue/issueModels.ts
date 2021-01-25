export interface Issue {
    id: string;
    amountBTC: string;
    creation: string;
    vaultBTCAddress: string;
    vaultDOTAddress: string;
    btcTxId: string;
    confirmations: number;
    completed: boolean;
    cancelled: boolean;
    fee: string;
    griefingCollateral: string;
};

export interface SatoshisTimeData {
    date: number;
    sat: number;
}
