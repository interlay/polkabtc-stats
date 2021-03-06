export interface TimeDataPoint {
    date: number;
    value: number;
}

export interface SatoshisTimeData {
    date: number;
    sat: number;
};

export interface DistributionStats {
    min: string;
    max: string;
    mean: string;
    stddev: string;
    percentiles: {
        quarter: string;
        median: string;
        threeQuarter: string;
    };
};
