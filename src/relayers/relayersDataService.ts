import {
    RelayerData,
    RelayerCountTimeData,
    RelayerSlaRanking,
} from "./relayersModel";
import { Filter, filtersToWhere, getDurationAboveMinSla } from "../common/util";
import pool from "../common/pool";
import { planckToDOT } from "@interlay/polkabtc";
import logFn from '../common/logger'
import {RelayerChallengeColumns} from "../common/columnTypes";
import format from "pg-format";

export const logger = logFn({ name: 'relayersDataService' });

export async function getRecentDailyRelayers(
    daysBack: number
): Promise<RelayerCountTimeData[]> {
    try {

        return (await pool.query(`
        SELECT extract(epoch from d.date) * 1000 as date,
        (
            SELECT COUNT(*) regs
            FROM (
                SELECT event_data->>2 AS id
                FROM v_parachain_data
                WHERE block_ts::date <= d.date
                    AND "section"='btcRelay'::text
                    AND "method"='StoreMainChainHeader'::text
                GROUP BY event_data->>2
            ) regs
        ) as regs,
        (SELECT COUNT(relayer_id) AS dereg FROM v_parachain_stakedrelayer_deregister WHERE block_ts::date <= d.date) as deregs
        FROM (SELECT (current_date - offs) AS date FROM generate_series(0, $1, 1) AS offs) d
        ORDER BY 1 ASC
            `, [daysBack]))
            .rows
            .map((row) => ({ date: row.date, count: Math.max(row.regs - row.deregs, 0) }));
    } catch (e) {
        logger.error(e);
        throw e;
    }
}

export async function getRelayersWithTrackRecord(
    minSla: number,
    consecutiveTimespan: number
): Promise<RelayerSlaRanking[]> {
    try {
        const res = await pool.query(`
            SELECT
                relayer_id,
                json_agg(row(new_sla, block_ts)) as sla_changes
            FROM v_parachain_stakedrelayer_sla_update
            GROUP BY relayer_id
            `);
        const reducedRows: RelayerSlaRanking[] = res.rows.map((row) => ({
            id: row.relayer_id,
            duration: getDurationAboveMinSla(
                minSla,
                row.sla_changes
            ),
            threshold: minSla,
        }));
        return reducedRows.filter((row) => row.duration >= consecutiveTimespan);
    } catch (e) {
        logger.error(e);
        throw e;
    }
}

export async function getAllRelayers(
    slaSince: number,
    page: number,
    perPage: number,
    sortBy: RelayerChallengeColumns,
    sortAsc: boolean,
    filters: Filter<RelayerChallengeColumns>[]
): Promise<RelayerData[]> {
    try {
        const res = await pool.query(`
            SELECT DISTINCT ON (reg.relayer_id)
                reg.relayer_id,
                0 as stake,
                reg.block_number,
                COALESCE(deregistered, FALSE) deregistered,
                COALESCE(slashed, FALSE) slashed,
                (SELECT COUNT(DISTINCT bitcoin_hash) count
                    FROM v_parachain_stakedrelayer_store
                    WHERE relayer_id = reg.relayer_id AND block_ts > $3) AS block_count,
                COALESCE(lifetime_sla_change, 0) lifetime_sla_change
            FROM
                (
                    SELECT DISTINCT ON (event_data->>2)
                        event_data->>2 AS relayer_id,
                        block_number
                    FROM v_parachain_data
                    WHERE "section"='btcRelay'::text
                        AND "method"='StoreMainChainHeader'::text
                    ORDER BY event_data->>2, block_number DESC
                ) reg
                LEFT OUTER JOIN
                  (
                    SELECT vault_id as relayer_id, sum(delta::BIGINT) as lifetime_sla_change
                    FROM v_parachain_stakedrelayer_sla_update_v2
                    WHERE block_ts > $3
                    GROUP BY relayer_id
                  ) sla_change
                USING (relayer_id)
                LEFT OUTER JOIN
                    (
                        SELECT DISTINCT ON (relayer_id)
                        relayer_id, block_number, TRUE deregistered
                        FROM v_parachain_stakedrelayer_deregister
                        ORDER BY relayer_id, block_number DESC
                    ) dereg
                ON reg.relayer_id = dereg.relayer_id AND reg.block_number < dereg.block_number
                LEFT OUTER JOIN
                    (
                        SELECT DISTINCT ON (relayer_id)
                        relayer_id, TRUE as slashed
                        FROM v_parachain_stakedrelayer_slash
                        ORDER BY relayer_id
                    ) slash
                ON reg.relayer_id = slash.relayer_id
                LEFT OUTER JOIN
                    (SELECT max(block_number) as block_number FROM parachain_events) latestblock
                ON TRUE
                ${filtersToWhere<RelayerChallengeColumns>(filters)}
                ORDER BY reg.relayer_id,
                ${format.ident(sortBy)} ${
                    sortAsc ? "ASC" : "DESC"
                }
                LIMIT $1 OFFSET $2
            `, [perPage, page * perPage, new Date(slaSince)]);
        return res.rows
            .filter((row) => !row.deregistered)
            .map((row) => {
                return {
                    id: row.relayer_id,
                    stake: planckToDOT(row.stake), // legacy value, unused
                    bonded: true, // legacy value, unused
                    slashed: row.slashed,
                    lifetime_sla: row.lifetime_sla_change,
                    block_count: row.block_count,
                };
            });
    } catch (e) {
        logger.error(e);
        throw e;
    }
}
