import { Controller, Get, Query, Route, Tags } from "tsoa";
import { getAllRelayers, getRecentDailyRelayers } from "./relayersDataService";
import { Relayer, RelayerCountTimeData } from "./relayersModel";

@Tags("stats")
@Route("relayers")
export class RelayersController extends Controller {
    @Get("recentDailyCounts")
    public async getRecentDailyRelayerCounts(
        @Query() daysBack = 5
    ): Promise<RelayerCountTimeData[]> {
        return getRecentDailyRelayers(daysBack);
    }

    @Get("")
    public async getRelayers(): Promise<Relayer[]> {
        return getAllRelayers();
    }
}
