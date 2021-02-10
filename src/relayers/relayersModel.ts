export interface RelayerCountTimeData {
    date: number;
    count: number;
}

export interface Relayer {
    id: string;
    stake: string;
    bonded: boolean;
    slashed: boolean;
}
