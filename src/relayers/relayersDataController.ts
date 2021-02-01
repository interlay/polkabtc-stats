import { Controller, Get, Query, Route, Tags } from "tsoa";
import { getRecentDailyRelayers } from "./relayersDataService";
import { RelayerCountTimeData } from "./relayersModel";

@Tags("stats")
@Route("relayers")
export class RelayersController extends Controller {
    @Get("recentDailyCounts")
    public async getRecentDailyRelayerCounts(
        @Query() daysBack = 5
    ): Promise<RelayerCountTimeData[]> {
        return getRecentDailyRelayers(daysBack);
    }
}
