import pool from "../common/pool";
import logFn from "../common/logger";
import { OracleStatus } from "./oracleModel";
import { ApiPromise } from "@polkadot/api";
import { hexStringFixedPointToBig } from "../common/util";

export const logger = logFn({ name: "oracleDataService" });

function computeOfflineStatusThreshold(onlineTimeout: number): Date {
    return new Date(Date.now() - onlineTimeout);

}

export async function getLatestSubmissionForEachOracle(
    api: ApiPromise,
    onlineTimeout: number,
    feed: string,
    namesMap: Map<string, string>
): Promise<OracleStatus[]> {
    try {
        const res = await pool.query(`
            SELECT DISTINCT oracle_id, exchange_rate, block_ts
            FROM v_parachain_oracle_set_exchange_rate main
            WHERE block_ts = (
                SELECT MAX(block_ts) 
                FROM v_parachain_oracle_set_exchange_rate v 
                WHERE v.oracle_id = main.oracle_id
            )
        `);
        const offlineStatusThreshold = computeOfflineStatusThreshold(onlineTimeout);
        return Promise.all(res.rows.map(async (row) => {
            const submissionMilliseconds = new Date(row.block_ts).getTime();
            const offlineOracleMilliseconds = offlineStatusThreshold.getTime();
            const online = submissionMilliseconds >= offlineOracleMilliseconds;
            return {
                id: row.oracle_id,
                source: namesMap.get(row.oracle_id) || "",
                feed,
                lastUpdate: new Date(row.block_ts),
                exchangeRate: hexStringFixedPointToBig(api, row.exchange_rate).toString(),
                online,
            };
        }));
    } catch (e) {
        logger.error(e);
        throw e;
    }
}

export async function getLatestSubmission(
    api: ApiPromise,
    onlineTimeout: number,
    feed: string,
    namesMap: Map<string, string>
): Promise<OracleStatus> {
    try {
        const res = await pool.query(`
            SELECT oracle_id, exchange_rate, block_ts
            FROM v_parachain_oracle_set_exchange_rate
            WHERE block_ts = (
                SELECT MAX(block_ts) 
                FROM v_parachain_oracle_set_exchange_rate
            )
        `);
        const row = res.rows[0];
        const offlineStatusThreshold = computeOfflineStatusThreshold(onlineTimeout);
        const submissionMilliseconds = new Date(row.block_ts).getTime();
        const offlineOracleThresholdMilliseconds = offlineStatusThreshold.getTime();
        const online = submissionMilliseconds >= offlineOracleThresholdMilliseconds;
        return {
            id: row.oracle_id,
            source: namesMap.get(row.oracle_id) || "",
            feed,
            lastUpdate: new Date(row.block_ts),
            exchangeRate: hexStringFixedPointToBig(api, row.exchange_rate).toString(),
            online,
        };
    } catch (e) {
        logger.error(e);
        throw e;
    }
}
