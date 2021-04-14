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

@Tags("stats")
@Route("issues")
export class IssuesController extends Controller {
    @Get("totalSuccessful")
    public async getTotalSuccessfulIssues(): Promise<string> {
        return getTotalSuccessfulIssues();
    }

    @Get("total")
    public async getTotalIssues(): Promise<string> {
        return getTotalIssues();
    }

    @Get("tvlPerTimestamp")
    public async getTvlForTimestamps(
        @Query() days: number[]
    ): Promise<SatoshisTimeData[]> {
        return getRecentDailyTVL(days);
    }

    @Get("recentDaily")
    public async getRecentDailyIssues(
        @Query() daysBack = 5
    ): Promise<SatoshisTimeData[]> {
        return getRecentDailyIssues(daysBack);
    }

    @Get("")
    public async getIssues(
        @Query() page = 0,
        @Query() perPage = 20,
        @Query() sortBy: IssueColumns = "block_number",
        @Query() sortAsc = false,
        @Query() network = "mainnet" as BtcNetworkName
    ): Promise<Issue[]> {
        return getPagedIssues(page, perPage, sortBy, sortAsc, [], network);
    }

    @Post("")
    public async getFilteredIssues(
        @Query() page = 0,
        @Query() perPage = 20,
        @Query() sortBy: IssueColumns = "block_number",
        @Query() sortAsc = false,
        @Body() filters: Filter<IssueColumns>[] = [],
        @Query() network = "mainnet" as BtcNetworkName
    ): Promise<Issue[]> {
        return getPagedIssues(page, perPage, sortBy, sortAsc, filters, network);
    }
}
