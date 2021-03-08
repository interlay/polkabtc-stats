import { Controller, Get, Query, Route, Tags } from "tsoa";
import { getAllRelayers, getRecentDailyRelayers, getRelayersWithTrackRecord } from "./relayersDataService";
import { RelayerData, RelayerCountTimeData, RelayerSlaRanking } from "./relayersModel";

@Tags("stats")
@Route("relayers")
export class RelayersController extends Controller {
    @Get("recentDailyCounts")
    public async getRecentDailyRelayerCounts(
        @Query() daysBack = 5
    ): Promise<RelayerCountTimeData[]> {
        return getRecentDailyRelayers(daysBack);
    }

    @Get("relayersWithTrackRecord")
    public async listRelayersWithTrackRecord(
        @Query() minSla = 0,
        @Query() minConsecutivePeriod = 0
    ): Promise<RelayerSlaRanking[]> {
        return getRelayersWithTrackRecord(minSla, minConsecutivePeriod);
    }

    /**
     * Retrieves a full list of relayers, along with the unbounded sum SLA scores
     * after a given cutoff.
     * @param slaSince A UNIX timestamp starting from which the SLA score will be summed.
     **/
    @Get("")
    public async getRelayers(
        @Query() slaSince: number
    ): Promise<RelayerData[]> {
        return getAllRelayers(slaSince);
    }
}
