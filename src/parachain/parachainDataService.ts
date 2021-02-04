import format from "pg-format";
import { StatusUpdate } from "./parachainModels";

import pool from "../common/pool";

export async function getPagedStatusUpdates(
    page: number,
    perPage: number,
    sortBy = "block_number",
    sortAsc = false
): Promise<StatusUpdate[]> {
    try {
        const res = await pool.query(
            `SELECT
                suggest.update_id, suggest.block_ts, suggest.new_status, NULL as old_status, suggest.add_error, suggest.remove_error, suggest.btc_block_hash, NULL as yeas, NULL as nays, exe.executed, reject.rejected, NULL as forced
            FROM
                "v_parachain_status_suggest" AS suggest
                LEFT OUTER JOIN
                    (SELECT
                        update_id, true AS executed
                    FROM "v_parachain_status_execute")
                AS exec USING (update_id)
                LEFT OUTER JOIN
                    (SELECT
                        update_id, true AS rejected
                    FROM "v_parachain_status_reject")
                AS rej USING (update_id)
            ORDER BY ${format.ident(sortBy)} ${
                sortAsc ? "ASC" : "DESC"
            }, update_id ASC
            LIMIT $1 OFFSET $2`,
            [perPage, page * perPage]
        );
        return res.rows.map((row) => ({
            id: row.update_id,
            timestamp: row.block_ts,
            proposedStatus: row.new_status,
            previousStatus: row.old_status,
            addError: row.add_error,
            removeError: row.remove_error,
            btc_block_hash: row.btc_block_hash,
            yeas: row.yeas,
            nays: row.nays,
            executed: row.executed ? true : false,
            rejected: row.cancelled ? true : false,
            forced: row.forced ? true : false,
        }));
    } catch (e) {
        console.error(e);
        throw e;
    }
}
