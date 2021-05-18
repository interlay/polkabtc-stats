import { Body, Controller, Get, Post, Query, Route, Tags } from "tsoa";
import {VaultChallengeColumns, VaultColumns} from "../common/columnTypes";
import {Filter} from "../common/util";
import {
    getRecentDailyVaults,
    getRecentDailyCollateral,
    getChallengeVaults,
    getVaultsWithTrackRecord,
    getAllVaults,
} from "./vaultDataService";
import { VaultChallengeData, VaultCountTimeData, CollateralTimeData, VaultSlaRanking, VaultData } from "./vaultModels";
import {STATS_DEFAULT_PERPAGE as defaultPerPage} from "../common/constants";

@Tags("stats")
@Route("vaults")
export class VaultsController extends Controller {
    /**
     * Gets the total number of vaults registered at midnight for the last several days
     * Does not take into account online status, only registration.
     * @param daysBack number of days (starting from the next midnight) to give datapoints for
     **/
    @Get("recentDailyCounts")
    public async getRecentDailyVaultCounts(
        @Query() daysBack = 5
    ): Promise<VaultCountTimeData[]> {
        return getRecentDailyVaults(daysBack);
    }

    /**
     * Gets the total number of collateral locked at midnight for the last several days
     * @param daysBack number of days (starting from the next midnight) to give datapoints for
     **/
    @Get("recentDailyCollateral")
    public async getRecentDailyCollateralLocked(
        @Query() daysBack = 5
    ): Promise<CollateralTimeData[]> {
        return getRecentDailyCollateral(daysBack);
    }

    /**
     * Returns a list of vaults with a minimum SLA track record, as specified by the parameters.
     * @param minSla the SLA theshold to consider
     * @param minConsecutivePeriod the duration above which the relayer must have had SLA above minSLA (in miliseconds)
     **/
    @Get("vaultsWithTrackRecord")
    public async listVaultsWithTrackRecord(
        @Query() minSla = 0,
        @Query() minConsecutivePeriod = 0
    ): Promise<VaultSlaRanking[]> {
        return getVaultsWithTrackRecord(minSla, minConsecutivePeriod);
    }

    /**
     * Retrieves a paged list of vaults, with numbers of issue and redeem requests,
     * and the unbounded sum SLA scores after a given cutoff.
     * @param slaSince A UNIX timestamp starting from which the SLA score will be summed.
     **/
    @Get("challengeVaultList")
    public async getChallengeVaults(
        @Query() page = 0,
        @Query() perPage = defaultPerPage,
        @Query() sortBy: VaultChallengeColumns = "block_number",
        @Query() sortAsc = false,
        @Query() slaSince: number
    ): Promise<VaultChallengeData[]> {
        return getChallengeVaults(page, perPage, sortBy, sortAsc, [], slaSince);
    }

    @Post("challengeVaultList")
    public async getChallengeFilteredVaults(
        @Query() page = 0,
        @Query() perPage = defaultPerPage,
        @Query() sortBy: VaultChallengeColumns = "block_number",
        @Query() sortAsc = false,
        @Body() filters: Filter<VaultChallengeColumns>[] = [],
        @Query() slaSince: number
    ): Promise<VaultChallengeData[]> {
        return getChallengeVaults(page, perPage, sortBy, sortAsc, filters, slaSince);
    }

    /**
     * Retrieves a paged list of vaults, with all dashboard stats (collateral, locked BTC,
     * etc.)
     **/
    @Get("")
    public async getVaults(
        @Query() page = 0,
        @Query() perPage = defaultPerPage,
        @Query() sortBy: VaultColumns = "block_number",
        @Query() sortAsc = false,
    ): Promise<VaultData[]> {
        return getAllVaults(page, perPage, sortBy, sortAsc, []);
    }

    @Post("")
    public async getFilteredVaults(
        @Query() page = 0,
        @Query() perPage = defaultPerPage,
        @Query() sortBy: VaultColumns = "block_number",
        @Query() sortAsc = false,
        @Body() filters: Filter<VaultColumns>[] = [],
    ): Promise<VaultData[]> {
        return getAllVaults(page, perPage, sortBy, sortAsc, filters);
    }
}
