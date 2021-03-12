import format from "pg-format";
import Big from "big.js";
import { ParachainStats, ParachainStatusUpdate } from "./parachainModels";

import pool from "../common/pool";
import { Filter, filtersToWhere } from "../common/util";
import { stripHexPrefix } from "@interlay/polkabtc";
import { StatusUpdateColumns } from "../common/columnTypes";
import logFn from "../common/logger";

export const logger = logFn({ name: "parachainDataService" });

export async function getStatusStats(): Promise<ParachainStats> {
    try {
        const res = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM v_parachain_stakedrelayer_register) registrations,
                (SELECT COUNT(*) FROM v_parachain_stakedrelayer_deregister) deregistrations,
                (SELECT COUNT(*) FROM v_parachain_status_suggest) suggested_updates,
                (SELECT COUNT(*) FROM v_parachain_status_execute) passed_updates,
                (SELECT COUNT(*) FROM v_parachain_status_reject) rejected_updates
        `);
        const row = res.rows[0];
        const totalUpdates = new Big(row.suggested_updates);
        return {
            totalStakedRelayers: new Big(row.registrations)
                .sub(row.deregistrations)
                .toNumber(),
            totalUpdateProposals: totalUpdates.toNumber(),
            declined: {
                count: row.rejected_updates,
                fractionOfTotal: totalUpdates.eq(0)
                    ? 0
                    : new Big(row.rejected_updates)
                          .div(totalUpdates)
                          .toNumber(),
            },
            passed: {
                count: row.passed_updates,
                fractionOfTotal: totalUpdates.eq(0)
                    ? 0
                    : new Big(row.passed_updates).div(totalUpdates).toNumber(),
            },
        };
    } catch (e) {
        logger.error(e);
        throw e;
    }
}

export async function getTotalStatusUpdates(): Promise<string> {
    try {
        const res = await pool.query(`
            select count(*) from (
                 select block_number from v_parachain_status_suggest
                 UNION ALL
                 select block_number from v_parachain_status_force
            ) as s
        `);
        return res.rows[0].count;
    } catch (e) {
        logger.error(e);
        throw e;
    }
}

export async function getPagedStatusUpdates(
    page: number,
    perPage: number,
    sortBy: StatusUpdateColumns,
    sortAsc: boolean,
    filters: Filter<StatusUpdateColumns>[]
): Promise<ParachainStatusUpdate[]> {
    try {
        const res = await pool.query(
            `
            SELECT
                suggest.update_id,
                suggest.block_ts,
                suggest.block_number,
                suggest.new_status,
                suggest.add_error,
                suggest.remove_error,
                suggest.btc_block_hash,
                (SELECT COUNT(*) FROM v_parachain_status_vote WHERE approve = 'true' AND update_id = suggest.update_id GROUP BY update_id) AS yeas,
                (SELECT COUNT(*) FROM v_parachain_status_vote WHERE approve = 'false' AND update_id = suggest.update_id GROUP BY update_id) AS nays,
                coalesce((SELECT TRUE AS executed FROM "v_parachain_status_execute" WHERE update_id = suggest.update_id), FALSE) AS executed,
                coalesce((SELECT TRUE AS rejected FROM "v_parachain_status_reject" WHERE update_id = suggest.update_id), FALSE) AS rejected,
                FALSE AS forced
            FROM
                "v_parachain_status_suggest" AS suggest
            UNION ALL
            SELECT
                NULL AS update_id,
                block_ts,
                block_number,
                new_status,
                add_error,
                remove_error,
                NULL AS btc_block_hash,
                NULL AS yeas,
                NULL AS nays,
                TRUE AS executed,
                FALSE AS rejected,
                TRUE AS forced
            FROM v_parachain_status_force AS force
            ${filtersToWhere<StatusUpdateColumns>(filters)}
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
            addError: row.add_error,
            removeError: row.remove_error,
            btc_block_hash: stripHexPrefix(row.btc_block_hash),
            yeas: row.yeas,
            nays: row.nays,
            executed: row.executed ? true : false,
            rejected: row.cancelled ? true : false,
            forced: row.forced ? true : false,
        }));
    } catch (e) {
        logger.error(e);
        throw e;
    }
}
