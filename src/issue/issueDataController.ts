import { Body, Controller, Get, Post, Query, Route, Tags } from "tsoa";
import {
    getTotalSuccessfulIssues,
    getTotalIssues,
    getRecentDailyIssues,
    getPagedIssues,
    getRecentDailyTVL,
} from "./issueDataService";
import { Issue } from "./issueModels";
import { SatoshisTimeData } from "../common/commonModels";
import { BtcNetworkName, Filter } from "../common/util";
import { IssueColumns } from "../common/columnTypes";
import {STATS_DEFAULT_PERPAGE as defaultPerPage} from "../common/constants";

@Tags("stats")
@Route("issues")
export class IssuesController extends Controller {
    /**
     * Returns the total count of successfully executed issues.
     **/
    @Get("totalSuccessful")
    public async getTotalSuccessfulIssues(): Promise<string> {
        return getTotalSuccessfulIssues();
    }

    /**
     * Retrieves the total value locked (i.e. polkaBTC issued - redeemed), snapshotted at the given timestamps.
     * @param days an array of timestamps, in miliseconds since the UNIX epoch
     **/
    @Get("tvlPerTimestamp")
    public async getTvlForTimestamps(
        @Query() days: number[]
    ): Promise<SatoshisTimeData[]> {
        return getRecentDailyTVL(days);
    }

    /**
     * Gets the total amount issued before midnight for the last several days
     * @param daysBack number of days (starting from the next midnight) to give datapoints for
     **/
    @Get("recentDaily")
    public async getRecentDailyIssues(
        @Query() daysBack = 5
    ): Promise<SatoshisTimeData[]> {
        return getRecentDailyIssues(daysBack);
    }

    /**
     * Retrieves a paged list of issue requests.
     * @param network the BTC network used for issue transactions; necessary to correctly
     * decode vault addresses and transaction IDs.
     **/
    @Get("")
    public async getIssues(
        @Query() page = 0,
        @Query() perPage = defaultPerPage,
        @Query() sortBy: IssueColumns = "block_number",
        @Query() sortAsc = false,
        @Query() network = "mainnet" as BtcNetworkName
    ): Promise<Issue[]> {
        return getPagedIssues(page, perPage, sortBy, sortAsc, [], network);
    }

    /**
     * Returns the total count of issue requests (regardless of execution).
     **/
    @Get("total")
    public async getTotalIssues(): Promise<number> {
        return getTotalIssues([]);
    }

    @Post("")
    public async getFilteredIssues(
        @Query() page = 0,
        @Query() perPage = defaultPerPage,
        @Query() sortBy: IssueColumns = "block_number",
        @Query() sortAsc = false,
        @Query() network = "mainnet" as BtcNetworkName,
        @Body() filters: Filter<IssueColumns>[] = []
    ): Promise<Issue[]> {
        return getPagedIssues(page, perPage, sortBy, sortAsc, filters, network);
    }

    @Post("total")
    public async getFilteredTotalIssues(
        @Body() filters: Filter<IssueColumns>[] = []
    ): Promise<number> {
        return getTotalIssues(filters);
    }
}
