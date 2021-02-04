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
        const res = await pool.query(`
            SELECT
                suggest.update_id,
                suggest.block_ts,
                suggest.block_number,
                suggest.new_status,
                NULL AS old_status,
                suggest.add_error,
                suggest.remove_error,
                suggest.btc_block_hash,
                coalesce(yeas.count, 0) AS yeas,
                coalesce(nays.count, 0) AS nays,
                coalesce(exec.executed, FALSE) AS executed,
                coalesce(rej.rejected, FALSE) AS rejected,
                FALSE AS forced
            FROM
                 "v_parachain_status_suggest" AS suggest
                 LEFT OUTER JOIN
                     (SELECT
                         update_id, TRUE AS executed
                     FROM "v_parachain_status_execute")
                 AS exec USING (update_id)
                 LEFT OUTER JOIN
                     (SELECT
                         update_id, TRUE AS rejected
                     FROM "v_parachain_status_reject")
                 AS rej USING (update_id)
                 LEFT OUTER JOIN
                     (SELECT
                           update_id, COUNT(*)
                       FROM v_parachain_status_vote
                       WHERE approve = 'true' GROUP BY update_id)
                 AS yeas USING (update_id)
                 LEFT OUTER JOIN
                      (SELECT
                            update_id, COUNT(*)
                        FROM v_parachain_status_vote
                        WHERE approve = 'false' GROUP BY update_id)
                  AS nays USING (update_id)
            UNION
            SELECT
                NULL AS update_id,
                block_ts,
                block_number,
                new_status,
                NULL AS old_status,
                add_error,
                remove_error,
                NULL AS btc_block_hash,
                NULL AS yeas,
                NULL AS nays,
                TRUE AS executed,
                FALSE AS rejected,
                TRUE AS forced
            FROM v_parachain_status_force AS force
        ORDER BY ${format.ident(sortBy)} ${
            sortAsc ? "ASC" : "DESC"
        }, update_id ASC
        LIMIT $1 OFFSET $2
            `,
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
