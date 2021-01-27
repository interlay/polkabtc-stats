import { Controller, Get, Query, Route, Tags } from "tsoa";
import {
    getRecentDailyVaults,
    getRecentDailyCollateral,
} from "./vaultDataService";
import { VaultCountTimeData, CollateralTimeData } from "./vaultModels";

@Tags("stats")
@Route("vaults")
export class VaultsController extends Controller {
    @Get("recentDailyCounts")
    public async getRecentDailyVaultCounts(
        @Query() daysBack = 5
    ): Promise<VaultCountTimeData[]> {
        return getRecentDailyVaults(daysBack);
    }

    @Get("recentDailyCollateral")
    public async getRecentDailyCollateralLocked(
        @Query() daysBack = 5
    ): Promise<CollateralTimeData[]> {
        return getRecentDailyCollateral(daysBack);
    }
}
