import pool from "../common/pool";
import logFn from "../common/logger";
import {ReplaceStats} from "./replaceModels";

export const logger = logFn({ name: "redeemDataService" });

export async function getReplaceStats(): Promise<ReplaceStats> {
    try {
        const res = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM v_parachain_replace_request) total,
                (SELECT COUNT(*) FROM v_parachain_replace_execute) executed,
                (SELECT COUNT(*) FROM v_parachain_replace_auction) auctioned,
                (SELECT COUNT(*) FROM v_parachain_replace_cancel) cancelled
        `);
        console.log(res.rows);
        const row = res.rows[0];
        return {
            total: row.total,
            totalSuccessful: row.executed,
            totalAuctions: row.auctioned,
            totalCancelled: row.cancelled,
        };
    } catch (e) {
        logger.error(e);
        throw e;
    }
}
