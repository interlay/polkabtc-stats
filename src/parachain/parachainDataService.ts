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
        //TODO: cleanup this entire code
        const res = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM v_parachain_stakedrelayer_register) registrations,
                (SELECT COUNT(*) FROM v_parachain_stakedrelayer_deregister) deregistrations,
                (SELECT COUNT(*) FROM v_parachain_status_suggest) suggested_updates,
                (SELECT COUNT(*) FROM v_parachain_status_execute) passed_updates,
                (SELECT COUNT(*) FROM v_parachain_status_reject) rejected_updates,
                COALESCE(SUM(yeas), 0) total_y,
                COALESCE(SUM(nays), 0) total_n,
                COALESCE(SUM(counts), 0) total_c,
                MIN(yeas) min_y,
                MIN(nays) min_n,
                MIN(counts) min_c,
                MAX(yeas) max_y,
                MAX(nays) max_n,
                MAX(counts) max_c,
                percentile_cont(ARRAY[0.25, 0.5, 0.75]) WITHIN GROUP (ORDER BY yeas) percentiles_y,
                percentile_cont(ARRAY[0.25, 0.5, 0.75]) WITHIN GROUP (ORDER BY yeas) percentiles_n,
                percentile_cont(ARRAY[0.25, 0.5, 0.75]) WITHIN GROUP (ORDER BY counts) percentiles_c,
                stddev_pop(yeas) stddev_y,
                stddev_pop(nays) stddev_n,
                stddev_pop(counts) stddev_c
            FROM
            (
                SELECT SUM(yea) yeas, SUM(nay) nays, SUM(yea + nay) counts
                FROM (
                    SELECT 1 AS yea, update_id FROM v_parachain_status_vote WHERE approve = 'true'
                ) y
                JOIN (
                    SELECT 1 AS nay, update_id FROM v_parachain_status_vote WHERE approve = 'false'
                ) n USING (update_id) GROUP BY update_id
            ) votes
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
            ayeVotes: {
                min: row.min_y,
                max: row.max_y,
                mean: totalUpdates.eq(0) ? "0" : new Big(row.total_y).div(totalUpdates).toString(),
                stddev: row.stddev_y,
                percentiles: row.percentiles_y ? {
                    quarter: row.percentiles_y[0],
                    median: row.percentiles_y[1],
                    threeQuarter: row.percentiles_y[2],
                } : {
                    quarter: 0,
                    median: 0,
                    threeQuarter: 0,
                },
            },
            nayVotes: {
                min: row.min_n,
                max: row.max_n,
                mean: totalUpdates.eq(0) ? "0" : new Big(row.total_n).div(totalUpdates).toString(),
                stddev: row.stddev_n,
                percentiles: row.percentiles_n ? {
                    quarter: row.percentiles_n[0],
                    median: row.percentiles_n[1],
                    threeQuarter: row.percentiles_n[2],
                } : {quarter: 0, median: 0, threeQuarter: 0},
            },
            voteCounts: {
                min: row.min_c,
                max: row.max_c,
                mean: totalUpdates.eq(0) ? "0" : new Big(row.total_c).div(totalUpdates).toString(),
                stddev: row.stddev_c,
                percentiles: row.percentiles_c ? {
                    quarter: row.percentiles_c[0],
                    median: row.percentiles_c[1],
                    threeQuarter: row.percentiles_c[2],
                } : {quarter: 0, median: 0, threeQuarter: 0},
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
                coalesce((SELECT DISTINCT TRUE AS executed FROM "v_parachain_status_execute" WHERE update_id = suggest.update_id), FALSE) AS executed,
                coalesce((SELECT DISTINCT TRUE AS rejected FROM "v_parachain_status_reject" WHERE update_id = suggest.update_id), FALSE) AS rejected,
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
            btc_block_hash: row.btc_block_hash? stripHexPrefix(row.btc_block_hash) : '',
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
