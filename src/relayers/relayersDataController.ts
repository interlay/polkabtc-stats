import { Body, Controller, Get, Post, Query, Route, Tags } from "tsoa";
import {RelayerColumns} from "../common/columnTypes";
import {Filter} from "../common/util";
import { getAllRelayers, getRecentDailyRelayers, getRelayersWithTrackRecord } from "./relayersDataService";
import { RelayerData, RelayerCountTimeData, RelayerSlaRanking } from "./relayersModel";

@Tags("stats")
@Route("relayers")
export class RelayersController extends Controller {
    /**
     * Gets the total number of relayers registered at midnight for the last several days
     * Does not take into account online status, only registration.
     * @param daysBack number of days (starting from the next midnight) to give datapoints for
     **/
    @Get("recentDailyCounts")
    public async getRecentDailyRelayerCounts(
        @Query() daysBack = 5
    ): Promise<RelayerCountTimeData[]> {
        return getRecentDailyRelayers(daysBack);
    }

    /**
     * Returns a list of relayers with a minimum SLA track record, as specified by the parameters.
     * @param minSla the SLA theshold to consider
     * @param minConsecutivePeriod the duration above which the relayer must have had SLA above minSLA (in miliseconds)
     **/
    @Get("relayersWithTrackRecord")
    public async listRelayersWithTrackRecord(
        @Query() minSla = 0,
        @Query() minConsecutivePeriod = 0
    ): Promise<RelayerSlaRanking[]> {
        return getRelayersWithTrackRecord(minSla, minConsecutivePeriod);
    }

    /**
     * Retrieves a paged list of relayers, along with the unbounded sum SLA scores
     * after a given cutoff.
     * @param slaSince A UNIX timestamp starting from which the SLA score will be summed.
     **/
    @Get("")
    public async getRelayers(
        @Query() page = 0,
        @Query() perPage = 20,
        @Query() sortBy: RelayerColumns = "block_number",
        @Query() sortAsc = false,
        @Query() slaSince: number
    ): Promise<RelayerData[]> {
        return getAllRelayers(page, perPage, sortBy, sortAsc, [], slaSince);
    }

    @Post("")
    public async getFilteredRelayers(
        @Query() page = 0,
        @Query() perPage = 20,
        @Query() sortBy: RelayerColumns = "block_number",
        @Query() sortAsc = false,
        @Body() filters: Filter<RelayerColumns>[] = [],
        @Query() slaSince: number
    ): Promise<RelayerData[]> {
        return getAllRelayers(page, perPage, sortBy, sortAsc, filters, slaSince);
    }
}
