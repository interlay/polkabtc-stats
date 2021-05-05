import { Body, Controller, Get, Post, Query, Route, Tags } from "tsoa";
import {
    getPagedRedeems,
    getTotalRedeems,
    getRecentDailyRedeems,
    getTotalSuccessfulRedeems,
    getTotalAmount,
} from "./redeemDataService";
import { Redeem } from "./redeemModel";
import { SatoshisTimeData } from "../common/commonModels";
import { BtcNetworkName, Filter } from "../common/util";
import { RedeemColumns } from "../common/columnTypes";
import {STATS_DEFAULT_PERPAGE as defaultPerPage} from "../common/constants";

@Tags("stats")
@Route("redeems")
export class RedeemsController extends Controller {
    /**
     * Returns the total count of successfully executed redeems.
     **/
    @Get("totalSuccessful")
    public async getTotalSuccessfulRedeems(): Promise<string> {
        return getTotalSuccessfulRedeems();
    }

    /**
     * Returns the total count of redeem requests (regardless of execution).
     **/
    @Get("total")
    public async getTotalRedeems(): Promise<string> {
        return getTotalRedeems();
    }

    /**
     * Retrieves the total value of polkaBTC successfully redeemed (all time).
     **/
    @Get("totalAmount")
    public async getTotalRedeemedAmount(): Promise<string> {
        return getTotalAmount();
    }

    /**
     * Gets the total amount redeemed before midnight for the last several days
     * @param daysBack number of days (starting from the next midnight) to give datapoints for
     **/
    @Get("recentDaily")
    public async getRecentDailyRedeems(
        @Query() daysBack = 5
    ): Promise<SatoshisTimeData[]> {
        return getRecentDailyRedeems(daysBack);
    }

    @Get("")
    public async getRedeems(
        @Query() page = 0,
        @Query() perPage = defaultPerPage,
        @Query() sortBy: RedeemColumns = "block_number",
        @Query() sortAsc = false,
        @Query() network: BtcNetworkName = "mainnet"
    ): Promise<Redeem[]> {
        return getPagedRedeems(page, perPage, sortBy, sortAsc, [], network);
    }

    /**
     * Retrieves a paged list of issue requests.
     * @param network the BTC network used for redeem transactions; necessary to correctly
     * decode vault addresses and transaction IDs.
     **/
    @Post("")
    public async getFilteredRedeems(
        @Query() page = 0,
        @Query() perPage = defaultPerPage,
        @Query() sortBy: RedeemColumns = "block_number",
        @Query() sortAsc = false,
        @Body() filters: Filter<RedeemColumns>[] = [],
        @Query() network: BtcNetworkName = "mainnet"
    ): Promise<Redeem[]> {
        return getPagedRedeems(
            page,
            perPage,
            sortBy,
            sortAsc,
            filters,
            network
        );
    }
}
