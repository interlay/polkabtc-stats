import { Controller, Get, Query, Route, Tags } from "tsoa";
import { getPagedBlocks, totalRelayedBlocks } from "./blockService";
import { BtcBlock } from "./blockModel";
import { BlockColumns } from "../common/columnTypes";
import {STATS_DEFAULT_PERPAGE as defaultPerPage} from "../common/constants";

@Tags("stats")
@Route("blocks")
export class CumulativeBlocksController extends Controller {
    /**
     * Retrieves a paged list of BTC blocks submitted to the relay.
     **/
    @Get("")
    public async getBlocks(
        @Query() page = 0,
        @Query() perPage = defaultPerPage,
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
