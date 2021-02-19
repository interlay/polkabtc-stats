import { Body, Controller, Get, Post, Query, Route, Tags } from "tsoa";
import {
    getPagedRedeems,
    getTotalRedeems,
    getRecentDailyRedeems,
    getTotalSuccessfulRedeems,
    getTotalAmount,
    RedeemColumns,
} from "./redeemDataService";
import { Redeem } from "./redeemModel";
import { SatoshisTimeData } from "../common/commonModels";
import {BtcNetworkName, Filter} from "../common/util";

@Tags("stats")
@Route("redeems")
export class RedeemsController extends Controller {
    @Get("totalSuccessful")
    public async getTotalSuccessfulRedeems(): Promise<string> {
        return getTotalSuccessfulRedeems();
    }

    @Get("total")
    public async getTotalRedeems(): Promise<string> {
        return getTotalRedeems();
    }

    @Get("totalAmount")
    public async getTotalRedeemedAmount(): Promise<string> {
        return getTotalAmount();
    }

    @Get("recentDaily")
    public async getRecentDailyRedeems(
        @Query() daysBack = 5
    ): Promise<SatoshisTimeData[]> {
        return getRecentDailyRedeems(daysBack);
    }

    @Get("")
    public async getRedeems(
        @Query() page = 0,
        @Query() perPage = 20,
        @Query() sortBy: RedeemColumns = "block_number",
        @Query() sortAsc = false,
        @Query() network: BtcNetworkName = "mainnet"
    ): Promise<Redeem[]> {
        return getPagedRedeems(page, perPage, sortBy, sortAsc, [], network);
    }

    @Post("")
    public async getFilteredRedeems(
        @Query() page = 0,
        @Query() perPage = 20,
        @Query() sortBy: RedeemColumns = "block_number",
        @Query() sortAsc = false,
        @Body() filters: Filter<RedeemColumns>[] = [],
        @Query() network: BtcNetworkName = "mainnet"
    ): Promise<Redeem[]> {
        return getPagedRedeems(page, perPage, sortBy, sortAsc, filters, network);
    }
}
