import { Controller, Get, Route, Tags } from "tsoa";
import {parachainConstants} from './constantsService';
import Big from "big.js";
import {ParachainConstants} from "./constantsModel";

@Tags("stats")
@Route("constants")
export class ParachainConstantsController extends Controller {
    @Get("")
    public async getParachainConstants(): Promise<ParachainConstants> {
        return await parachainConstants;
    }

    @Get("dustValue")
    public async getDustValue(): Promise<number> {
        return (await parachainConstants).dustValue;
    }

    @Get("btcConfirmations")
    public async getBtcConfirmations(): Promise<number> {
        return (await parachainConstants).btcConfirmations;
    }

    @Get("issuePeriod")
    public async getIssuePeriod(): Promise<number> {
        return (await parachainConstants).issuePeriod;
    }

    @Get("issueFee")
    public async getIssueFee(): Promise<Big> {
        return (await parachainConstants).issueFee;
    }

    @Get("issueGriefingCollateral")
    public async getIssueGriefingCollateral(): Promise<Big> {
        return (await parachainConstants).issueGriefingCollateral;
    }

    @Get("premiumRedeemFee")
    public async getPremiumRedeemFee(): Promise<Big> {
        return (await parachainConstants).premiumRedeemFee;
    }

    @Get("vaultPunishmentFee")
    public async getVaultPunishmentFee(): Promise<Big> {
        return (await parachainConstants).vaultPunishmentFee;
    }

    @Get("secureCollateralThreshold")
    public async getSecureCollateralThreshold(): Promise<Big> {
        return (await parachainConstants).secureCollateralThreshold;
    }
}
