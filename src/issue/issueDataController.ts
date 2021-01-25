import { Controller, Get, Query, Route, Tags } from "tsoa";
import {
    getSuccessfulIssues,
    getRecentDailyIssues,
    getPagedIssues,
} from "./issueDataService";
import { Issue, SatoshisTimeData } from "./issueModels";

@Tags("stats")
@Route("issues")
export class CumulativeIssuesController extends Controller {
    @Get("totalSuccessful")
    public async getTotalSuccessfulIssues(): Promise<string> {
        return getSuccessfulIssues();
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
        @Query() sortBy = "block_number",
        @Query() sortAsc = false
    ): Promise<Issue[]> {
        return getPagedIssues(page, perPage, sortBy, sortAsc);
    }
}
