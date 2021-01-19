import {
    Controller,
    Get,
    Route,
} from "tsoa";
import { getSuccessfulIssues } from "./issueDataService";

@Route("issues")
export class CumulativeIssuesController extends Controller {
    @Get("totalSuccessful")
    public async getTotalSuccessfulIssues(): Promise<string> {
        return getSuccessfulIssues();
    }
}
