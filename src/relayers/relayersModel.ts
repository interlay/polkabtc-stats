export interface RelayerCountTimeData {
    date: number;
    count: number;
}

export interface RelayerData {
    id: string;
    stake: string;
    bonded: boolean;
    slashed: boolean;
}
