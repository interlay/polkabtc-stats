import { Controller, Get, Query, Route, Tags } from "tsoa";
import { getPagedBlocks, highestBlock, totalRelayedBlocks } from "./blockService";
import { BtcBlock } from "./blockModel";
import { BlockColumns } from "../common/columnTypes";
import {STATS_DEFAULT_PERPAGE as defaultPerPage} from "../common/constants";
import Big from "big.js";

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
    public async getTotalRelayedBlocksCount(): Promise<Big> {
        return totalRelayedBlocks();
    }

    /**
     * Retrieves the latest btc block submitted to BTCRelay.
     **/
    @Get("highestBlock")
    public async getHighestBTCBlock(): Promise<Big> {
        return highestBlock();
    }
}
