import { Controller, Get, Query, Route, Tags } from "tsoa";
import { getPagedBlocks, totalRelayedBlocks } from "./blockService";
import { BtcBlock } from "./blockModel";
import { BlockColumns } from "../common/columnTypes";

@Tags("stats")
@Route("blocks")
export class CumulativeBlocksController extends Controller {
    /**
     * Retrieves a paged list of BTC blocks submitted to the relay.
     **/
    @Get("")
    public async getBlocks(
        @Query() page = 0,
        @Query() perPage = 20,
        @Query() sortBy: BlockColumns = "height",
        @Query() sortAsc = false
    ): Promise<BtcBlock[]> {
        return getPagedBlocks(page, perPage, sortBy, sortAsc);
    }

    /**
     * Retrieves the total amount of blocks submitted to BTCRelay.
     **/
    @Get("count")
    public async getTotalRelayedBlocksCount(): Promise<string> {
        return totalRelayedBlocks();
    }
}
