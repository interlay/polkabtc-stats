import { RelayerData, RelayerCountTimeData } from "./relayersModel";
import { runPerDayQuery } from "../common/util";
import pool from "../common/pool";
import { planckToDOT } from "@interlay/polkabtc";

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

export async function getAllRelayers(): Promise<RelayerData[]> {
    try {
        const res = await pool.query(`
            SELECT DISTINCT ON (reg.relayer_id)
                reg.relayer_id,
                reg.stake,
                COALESCE(deregistered, FALSE) deregistered,
                COALESCE(slashed, FALSE) slashed,
                maturity::Integer < latestblock.block_number bonded
            FROM
                v_parachain_stakedrelayer_register reg
                LEFT OUTER JOIN
                    (SELECT DISTINCT ON (relayer_id)
                        relayer_id, block_number, TRUE deregistered
                    FROM v_parachain_stakedrelayer_deregister
                    ORDER BY relayer_id, block_number DESC) dereg
                ON reg.relayer_id = dereg.relayer_id AND reg.block_number < dereg.block_number
                LEFT OUTER JOIN
                    (SELECT DISTINCT ON (relayer_id)
                        relayer_id, TRUE as slashed
                    FROM v_parachain_stakedrelayer_slash
                    ORDER BY relayer_id) slash
                ON reg.relayer_id = slash.relayer_id
                LEFT OUTER JOIN
                    (SELECT block_number
                    FROM parachain_events
                    ORDER BY block_number DESC
                    LIMIT 1) latestblock
                ON TRUE
                ORDER BY reg.relayer_id, reg.block_number DESC
            `);
        return res.rows.filter((row) => !row.deregistered).map((row) => ({
            id: row.relayer_id,
            stake: planckToDOT(row.stake),
            bonded: row.bonded,
            slashed: row.slashed,
        }));
    } catch (e) {
        console.error(e);
        throw e;
    }
}
