import { Controller, Get, Query, Route, Tags } from "tsoa";
import { getPagedBlocks } from "./blockService";
import { Block } from "./blockModel";

@Tags("stats")
@Route("blocks")
export class CumulativeBlocksController extends Controller {
    @Get("")
    public async getBlocks(
        @Query() page = 0,
        @Query() perPage = 20,
        @Query() sortBy = "height",
        @Query() sortAsc = false
    ): Promise<Block[]> {
        return getPagedBlocks(page, perPage, sortBy, sortAsc);
    }
}
