import { IssueStats } from "../issue/issueModels";
import { ParachainStats } from "../parachain/parachainModels";
import { RedeemStats } from "../redeem/redeemModel";
import { ReplaceStats } from "../replace/replaceModels";
import { VaultStats } from "../vaults/vaultModels";

export interface AccountStats {
    totalUsers: number;
    fullProcessUsers: number;
    onlyIssuedUsers: number;
    abandonedIssueUsers: number;
}

export interface Report {
    issue: IssueStats;
    redeem: RedeemStats;
    users: AccountStats;
    vaults: VaultStats;
    replace: ReplaceStats;
    statusUpdates: ParachainStats;
}

export interface CollateralisationsAtTime {
    timestamp: number;
    collateralisations: string[];
}
