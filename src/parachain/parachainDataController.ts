import { Body, Controller, Get, Post, Query, Route, Tags } from "tsoa";
import { StatusUpdateColumns } from "../common/columnTypes";
import { Filter } from "../common/util";
import {
    getPagedStatusUpdates,
    getTotalStatusUpdates,
} from "./parachainDataService";
import { ParachainStatusUpdate } from "./parachainModels";

@Tags("stats")
@Route("statusUpdates")
export class ParachainController extends Controller {
    /**
     * Retrieves a paged list of parachain status updates.
     **/
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

    /**
     * Gets the total count of status updates submitted (regardless of voting status).
     **/
    @Get("total")
    public async getTotalParachainStatusUpdates(): Promise<string> {
        return getTotalStatusUpdates();
    }
}
