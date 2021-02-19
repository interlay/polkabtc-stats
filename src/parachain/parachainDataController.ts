import { Body, Controller, Get, Post, Query, Route, Tags } from "tsoa";
import {Filter} from "../common/util";
import {
    getPagedStatusUpdates, getTotalStatusUpdates, StatusUpdateColumns,
} from "./parachainDataService";
import { ParachainStatusUpdate } from "./parachainModels";

@Tags("stats")
@Route("statusUpdates")
export class ParachainController extends Controller {
    @Get("")
    public async getParachainStatusUpdates(
        @Query() page = 0,
        @Query() perPage = 20,
        @Query() sortBy: StatusUpdateColumns = "block_number",
        @Query() sortAsc = false
    ): Promise<ParachainStatusUpdate[]> {
        return getPagedStatusUpdates(page, perPage, sortBy, sortAsc, []);
    }

    @Post("")
    public async getFilteredParachainStatusUpdates(
        @Query() page = 0,
        @Query() perPage = 20,
        @Query() sortBy: StatusUpdateColumns = "block_number",
        @Query() sortAsc = false,
        @Body() filters: Filter<StatusUpdateColumns>[] = []
    ): Promise<ParachainStatusUpdate[]> {
        return getPagedStatusUpdates(page, perPage, sortBy, sortAsc, filters);
    }


    @Get("total")
    public async getTotalParachainStatusUpdates(): Promise<string> {
        return getTotalStatusUpdates();
    }
}
