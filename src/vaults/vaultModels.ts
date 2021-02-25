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
    request_issue_count: number;
    execute_issue_count: number;
    request_redeem_count: number;
    execute_redeem_count: number;
    cancel_redeem_count: number;
}
