import { Relayer, RelayerCountTimeData} from "./relayersModel";
import { runPerDayQuery } from "../common/util";
import pool from "../common/pool";

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
                    reg - dereg AS value
                FROM
                    (
                        SELECT
                            COUNT(relayer_id) AS reg
                        FROM v_parachain_stakedrelayer_register
                        WHERE block_ts < '${ts}'
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

export async function getAllRelayers(): Promise<Relayer[]> {
    try {
        const res = await pool.query(`
        SELECT
            relayer_id,
            stake,
            COALESCE(deregistered, FALSE) AS deregistered,
            COALESCE(slashed, FALSE) AS slashed,
            maturity::Integer < latestblock.block_number AS bonded
        FROM
            v_parachain_stakedrelayer_register
            LEFT OUTER JOIN
                (SELECT
                    relayer_id, TRUE as deregistered
                FROM v_parachain_stakedrelayer_deregister)
            AS dereg USING (relayer_id)
            LEFT OUTER JOIN
                (SELECT
                    relayer_id, TRUE as slashed
                FROM v_parachain_stakedrelayer_slash)
            AS slash USING (relayer_id)
            LEFT OUTER JOIN
                (SELECT block_number
                FROM parachain_events
                ORDER BY block_number DESC
                LIMIT 1)
            AS latestblock ON TRUE
        `);
        return res.rows.filter((row) => !row.deregistered).map((row) => ({
            id: row.relayer_id,
            stake: row.stake,
            bonded: row.bonded,
            slashed: row.slashed,
        }));
    } catch (e) {
        console.error(e);
        throw e;
    }
}
