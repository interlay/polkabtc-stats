import {DistributionStats} from "../common/commonModels";

export interface Redeem {
    id: string;
    requester: string;
    amountPolkaBTC: string;
    feePolkabtc: string;
    dotPremium: string;
    creation: string;
    timestamp: string;
    vaultDotAddress: string;
    btcAddress: string;
    btcTxId: string;
    confirmations?: number;
    btcBlockHeight: number;
    completed: boolean;
    cancelled: boolean;
    reimbursed: boolean;
    isExpired: boolean;
};

export interface RedeemStats {
    totalRequests: number;
    totalSuccesses: number;
    totalPremium: number;
    premiumFraction: number;
    totalLiquidated: number;
    liquidatedFraction: number;
    totalPolkaBTCRedeemed: string;
    averageRequest: DistributionStats;
}
