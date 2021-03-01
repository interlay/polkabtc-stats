export interface RelayerCountTimeData {
    date: number;
    count: number;
}

export interface RelayerData {
    id: string;
    stake: string;
    bonded: boolean;
    slashed: boolean;
    lifetime_sla: number;
    block_count: number;
}

export interface RelayerSlaRanking {
    id: string;
    threshold: number;
    duration: number;
}
