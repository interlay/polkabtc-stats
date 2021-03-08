import { Controller, Get, Query, Route, Tags } from "tsoa";
import {
    getRecentDailyVaults,
    getRecentDailyCollateral,
    getAllVaults,
    getVaultsWithTrackRecord,
} from "./vaultDataService";
import { VaultData, VaultCountTimeData, CollateralTimeData, VaultSlaRanking } from "./vaultModels";

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

    @Get("vaultsWithTrackRecord")
    public async listVaultsWithTrackRecord(
        @Query() minSla = 0,
        @Query() minConsecutivePeriod = 0
    ): Promise<VaultSlaRanking[]> {
        return getVaultsWithTrackRecord(minSla, minConsecutivePeriod);
    }

    /**
     * Retrieves a full list of vaults, along with the unbounded sum SLA scores
     * after a given cutoff.
     * @param slaSince A UNIX timestamp starting from which the SLA score will be summed.
     **/
    @Get("")
    public async getVaults(
        @Query() slaSince: number
    ): Promise<VaultData[]> {
        return getAllVaults(slaSince);
    }
}
