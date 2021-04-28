import pool from "../common/pool";
import logFn from "../common/logger";
import { OracleStatus } from "./oracleModel";
import { hexStringFixedPointToBig } from "../common/util";

export const logger = logFn({ name: "oracleDataService" });

function computeOfflineStatusThreshold(onlineTimeout: number): Date {
    return new Date(Date.now() - onlineTimeout);

}

export async function getLatestSubmissionForEachOracle(
    onlineTimeout: number,
    feed: string,
    namesMap: Map<string, string>
): Promise<OracleStatus[]> {
    try {
        const lastOracleUpdate = await pool.query(`SELECT oracle_id, MAX(block_number) AS block_number
            FROM v_parachain_oracle_set_exchange_rate
            GROUP BY oracle_id;`)

        const offlineStatusThreshold = computeOfflineStatusThreshold(onlineTimeout);

        return Promise.all(lastOracleUpdate.rows.map(async lastUpdateBlock => {

            const res = await pool.query(`
            SELECT oracle_id, exchange_rate, block_ts
            FROM v_parachain_oracle_set_exchange_rate
            WHERE block_number = $1 and oracle_id = $2
        `, [lastUpdateBlock.block_number, lastUpdateBlock.oracle_id]);

            return res.rows.map(async (row) => {
                const submissionMilliseconds = new Date(row.block_ts).getTime();
                const offlineOracleMilliseconds = offlineStatusThreshold.getTime();
                const online = submissionMilliseconds >= offlineOracleMilliseconds;
                return {
                    id: row.oracle_id,
                    source: namesMap.get(row.oracle_id) || "",
                    feed,
                    lastUpdate: new Date(row.block_ts),
                    exchangeRate: hexStringFixedPointToBig(row.exchange_rate).toString(),
                    online,
                };
            })[0]
        }))
    } catch (e) {
        logger.error(e);
        throw e;
    }
}

export async function getLatestSubmission(
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
            exchangeRate: hexStringFixedPointToBig(row.exchange_rate).toString(),
            online,
        };
    } catch (e) {
        logger.error(e);
        throw e;
    }
}
