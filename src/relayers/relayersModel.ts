export interface RelayerCountTimeData {
    date: number;
    count: number;
}

export interface RelayerData {
    id: string;
    stake: string;
    bonded: boolean;
    slashed: boolean;
    block_count: number;
}

export interface RelayerSlaRanking {
    id: string;
    threshold: number;
    duration: number;
}
