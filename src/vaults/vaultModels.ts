export interface CollateralTimeData {
    date: number;
    amount: number;
}

export interface VaultCountTimeData {
    date: number;
    count: number;
}

export interface VaultData {
    id: string;
    collateral: string;
}

export interface VaultSlaRanking {
    id: string;
    threshold: number;
    duration: number;
}
