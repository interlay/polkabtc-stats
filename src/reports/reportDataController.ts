import { Controller, Get, Route, Tags } from "tsoa";
import { getIssueStats } from "../issue/issueDataService";
import { IssueStats } from "../issue/issueModels";
import { getRedeemStats } from "../redeem/redeemDataService";
import { RedeemStats } from "../redeem/redeemModel";
import {AccountStats} from "./reportModels";
import {getAccountStats} from "./repotDataService";

@Tags("stats")
@Route("reports")
export class ReportController extends Controller {
    @Get("issueStats")
    public async getIssueStats(): Promise<IssueStats> {
        return getIssueStats();
    }

    @Get("redeemStats")
    public async getRedeemStats(): Promise<RedeemStats> {
        return getRedeemStats();
    }

    @Get("userStats")
    public async getUserCountStats(): Promise<AccountStats> {
        return getAccountStats();
    }
}
