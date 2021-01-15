import {
    Controller,
    Get,
    Path,
    Route,
} from "tsoa";
import { CumulativeDatapoint } from "./cumulativeDatapoint";
import { getIssues } from "./cumulativeDataService";

@Route("issues")
export class CumulativeIssuesController extends Controller {
    @Get("{block}")
    public async getCumulativeIssues(
        @Path() block: number,
    ): Promise<CumulativeDatapoint> {
        return getIssues(block);
    }
}
