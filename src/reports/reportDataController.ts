import {range} from "lodash";
import { Controller, Get, Query, Route, Tags } from "tsoa";
import { getIssueStats } from "../issue/issueDataService";
import { IssueStats } from "../issue/issueModels";
import { getStatusStats } from "../parachain/parachainDataService";
import { ParachainStats } from "../parachain/parachainModels";
import { getRedeemStats } from "../redeem/redeemDataService";
import { RedeemStats } from "../redeem/redeemModel";
import { getReplaceStats } from "../replace/replaceDataService";
import { ReplaceStats } from "../replace/replaceModels";
import { getVaultCollateralisationsAtTime, getVaultStats } from "../vaults/vaultDataService";
import { VaultStats } from "../vaults/vaultModels";
import { AccountStats, CollateralisationsAtTime, Report } from "./reportModels";
import { getAccountStats } from "./repotDataService";

@Tags("stats")
@Route("reports")
export class ReportController extends Controller {
    @Get("issueStats")
    public async getIssueStats(): Promise<IssueStats> {
        return getIssueStats();
    }

    @Get("redeemStats")
    public async getRedeemStats(): Promise<RedeemStats> {
        return getRedeemStats();
    }

    @Get("userStats")
    public async getUserCountStats(): Promise<AccountStats> {
        return getAccountStats();
    }

    @Get("vaultStats")
    public async getVaultStats(): Promise<VaultStats> {
        return getVaultStats();
    }

    @Get("vaultCollateralStats")
    public async getVaultCollateralisationStatsAtTime(
        @Query() timestamp: number
    ): Promise<string[]> {
        return getVaultCollateralisationsAtTime(timestamp);
    }

    @Get("recentVaultCollateralisations")
    public async getRecentVaultCollateralisatonRates(
    ): Promise<CollateralisationsAtTime[]> {
        const now = Date.now();
        const times = range(0, 14).map((day) => now - day * 86400 * 1000);
        return Promise.all(times.map(async (timestamp) => {
            const collateralisations = await getVaultCollateralisationsAtTime(timestamp);
            return {
                timestamp,
                collateralisations,
            };
        }));
    }

    @Get("replaceStats")
    public async getReplaceStats(): Promise<ReplaceStats> {
        return getReplaceStats();
    }

    @Get("statusVotingStats")
    public async getStatusUpdateStats(): Promise<ParachainStats> {
        return getStatusStats();
    }

    @Get("")
    public async getFullReport(): Promise<Report> {
        const [
            issue,
            redeem,
            users,
            vaults,
            replace,
            statusUpdates,
        ] = await Promise.all([
            getIssueStats(),
            getRedeemStats(),
            getAccountStats(),
            getVaultStats(),
            getReplaceStats(),
            getStatusStats(),
        ]);
        return { issue, redeem, users, vaults, replace, statusUpdates };
    }
}
