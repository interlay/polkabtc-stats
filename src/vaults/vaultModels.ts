import { DistributionStats } from "../common/commonModels";
import BN from "bn.js";
import Big from "big.js";

export interface CollateralTimeData {
    date: number;
    amount: BN;
}

export interface VaultCountTimeData {
    date: number;
    count: number;
}

export interface Vault {
    id: string;
    collateral: Big;
    lockedBTC: number;
    pendingBTC: number;
    collateralization: number;
    pendingCollateralization: number;
    capacity: Big;
    registrationBlock: Big;
    status: {
        committedTheft: boolean;
        liquidated: boolean;
        banned?: number;
    }
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
    };
    collateralDistribution: DistributionStats;
}
