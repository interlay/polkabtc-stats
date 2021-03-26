import { Controller, Get, Route, Tags } from "tsoa";
import { getLatestSubmission, getLatestSubmissionForEachOracle } from "./oracleDataService";
import { getPolkaBtc } from "../common/polkaBtc";
import { OracleStatus } from "./oracleModel";

interface CachedOracleData {
    onlineTimeout: number;
    feed: string;
    namesMap: Map<string, string>
}

@Tags("stats")
@Route("oracle")
export class OracleDataController extends Controller {
    cachedOracleData: Promise<CachedOracleData> = (async () => {
        const polkabtc = await getPolkaBtc();
        const onlineTimeout = await polkabtc.oracle.getOnlineTimeout();
        const feed = await polkabtc.oracle.getFeed();
        const namesMap = await polkabtc.oracle.getSourcesById();
        return {
            onlineTimeout, feed, namesMap
        };
    })();

    @Get("/submissions")
    public async getLatestSubmissionForEachOracle(): Promise<OracleStatus[]> {
        const oracleCache = await this.cachedOracleData;
        const polkabtc = await getPolkaBtc();
        return getLatestSubmissionForEachOracle(polkabtc.api, oracleCache.onlineTimeout, oracleCache.feed, oracleCache.namesMap);
    }

    @Get("/latest")
    public async getLatestSubmission(): Promise<OracleStatus> {
        const oracleCache = await this.cachedOracleData;
        const polkabtc = await getPolkaBtc();
        return getLatestSubmission(polkabtc.api, oracleCache.onlineTimeout, oracleCache.feed, oracleCache.namesMap);
    }

}
