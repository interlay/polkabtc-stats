import { Controller, Get, Query, Route, Tags } from "tsoa";
import {
    getPagedStatusUpdates, getTotalStatusUpdates,
} from "./parachainDataService";
import { StatusUpdate } from "./parachainModels";

@Tags("stats")
@Route("statusUpdates")
export class ParachainController extends Controller {
    @Get("")
    public async getParachainStatusUpdates(
        @Query() page = 0,
        @Query() perPage = 20,
        @Query() sortBy = "block_number",
        @Query() sortAsc = false
    ): Promise<StatusUpdate[]> {
        return getPagedStatusUpdates(page, perPage, sortBy, sortAsc);
    }

    @Get("total")
    public async getTotalParachainStatusUpdates(): Promise<string> {
        return getTotalStatusUpdates();
    }
}
