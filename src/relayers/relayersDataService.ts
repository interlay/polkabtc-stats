import {
    RelayerData,
    RelayerCountTimeData,
    RelayerSlaRanking,
} from "./relayersModel";
import Big from "big.js";
import {
    getDurationAboveMinSla,
    hexStringFixedPointToBig,
    runPerDayQuery,
} from "../common/util";
import pool from "../common/pool";
import { planckToDOT } from "@interlay/polkabtc";
import { getPolkaBtc } from "../common/polkaBtc";

export async function getRecentDailyRelayers(
    daysBack: number
): Promise<RelayerCountTimeData[]> {
    try {
        return (
            await runPerDayQuery(
                daysBack,
                (i, ts) =>
                    `
                SELECT
                    ${i} AS idx,
                    GREATEST(reg - dereg, 0) AS value
                FROM
                    (
                        SELECT
                            COUNT(relayer_id) AS reg
                        FROM v_parachain_stakedrelayer_register
                        LEFT OUTER JOIN
                            (SELECT block_number
                            FROM parachain_events
                            ORDER BY block_number DESC
                            LIMIT 1) latestblock
                        ON TRUE
                        WHERE
                            block_ts < '${ts}'
                            AND maturity::Integer < latestblock.block_number
                    ) as r,
                    (
                        SELECT
                            COUNT(relayer_id) AS dereg
                        FROM v_parachain_stakedrelayer_deregister
                        WHERE block_ts < '${ts}'
                    ) as d
            `
            )
        ).map((row) => ({ date: row.date, count: row.value }));
    } catch (e) {
        console.error(e);
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
            GROUP BY vault_id
            `);
        const polkaBtc = await getPolkaBtc();
        const reducedRows: RelayerSlaRanking[] = res.rows.map((row) => ({
            id: row.relayer_id,
            duration: getDurationAboveMinSla(
                polkaBtc.api,
                minSla,
                row.sla_changes
            ),
            threshold: minSla,
        }));
        return reducedRows.filter((row) => row.duration >= consecutiveTimespan);
    } catch (e) {
        console.error(e);
        throw e;
    }
}

export async function getAllRelayers(): Promise<RelayerData[]> {
    try {
        const res = await pool.query(`
            SELECT DISTINCT ON (reg.relayer_id)
                reg.relayer_id,
                reg.stake,
                COALESCE(deregistered, FALSE) deregistered,
                COALESCE(slashed, FALSE) slashed,
                maturity::Integer < latestblock.block_number bonded,
                COALESCE(store.count, 0) AS block_count,
                lifetime_sla_change
            FROM
                v_parachain_stakedrelayer_register reg
                LEFT OUTER JOIN
                  (
                    SELECT relayer_id, array_agg(delta) lifetime_sla_change
                    FROM v_parachain_stakedrelayer_sla_update
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
                    (
                        SELECT relayer_id, COUNT(DISTINCT bitcoin_hash) count
                        FROM v_parachain_stakedrelayer_store
                        GROUP BY relayer_id
                    ) store
                ON reg.relayer_id = store.relayer_id
                LEFT OUTER JOIN
                    (
                        SELECT block_number
                        FROM parachain_events
                        ORDER BY block_number DESC
                        LIMIT 1
                    ) latestblock
                ON TRUE
                ORDER BY reg.relayer_id, reg.block_number DESC
            `);
        const polkaBtc = await getPolkaBtc();
        return res.rows
            .filter((row) => !row.deregistered)
            .map((row) => ({
                id: row.relayer_id,
                stake: planckToDOT(row.stake),
                bonded: row.bonded,
                slashed: row.slashed,
                lifetime_sla: row.lifetime_sla_change
                    ? row.lifetime_sla_change.reduce(
                          (acc: Big, encodedDelta: string) =>
                              hexStringFixedPointToBig(
                                  polkaBtc.api,
                                  encodedDelta
                              ).add(acc),
                          new Big(0)
                      )
                    : 0,
                block_count: row.block_count,
            }));
    } catch (e) {
        console.error(e);
        throw e;
    }
}
