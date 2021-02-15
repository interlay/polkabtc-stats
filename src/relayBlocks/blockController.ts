import { Controller, Get, Query, Route, Tags } from "tsoa";
import { getPagedBlocks, totalRelayedBlocks } from "./blockService";
import { BtcBlock } from "./blockModel";

@Tags("stats")
@Route("blocks")
export class CumulativeBlocksController extends Controller {
    @Get("")
    public async getBlocks(
        @Query() page = 0,
        @Query() perPage = 20,
        @Query() sortBy = "height",
        @Query() sortAsc = false
    ): Promise<BtcBlock[]> {
        return getPagedBlocks(page, perPage, sortBy, sortAsc);
    }

    @Get("count")
    public async getTotalRelayedBlocksCount(
    ): Promise<string> {
        return totalRelayedBlocks();
    }
}
