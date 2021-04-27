import { DistributionStats } from "../common/commonModels";

export interface CollateralTimeData {
    date: number;
    amount: string;
}

export interface VaultCountTimeData {
    date: number;
    count: string;
}

export interface VaultData {
    id: string;
    collateral: string;
    request_issue_count: number;
    execute_issue_count: number;
    request_redeem_count: number;
    execute_redeem_count: number;
    cancel_redeem_count: number;
    lifetime_sla: number;
}

export interface VaultSlaRanking {
    id: string;
    threshold: number;
    duration: number;
}

export interface VaultStats {
    total: number;
    thefts: number;
    thiefVaults: number;
    liquidations: {
        count: number;
        btcFraction: number;
        dotFraction: number;
    },
    collateralDistribution: DistributionStats;
}
