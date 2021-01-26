import { CollateralTimeData, VaultCountTimeData } from "./vaultModels";
import { dateToMidnight, msInDay } from "../common/util";
import pool from "../common/pool";

export async function getRecentDailyVaults(
    daysBack: number
): Promise<VaultCountTimeData[]> {
    try {
        let query = "";
        const dayBoundaries: number[] = [];
        for (let i = 0; i < daysBack; i++) {
            const dayBoundary = dateToMidnight(Date.now() - i * msInDay);
            dayBoundaries.push(dayBoundary);

            query += `SELECT
                    '${i}' AS idx,
                    COUNT(*)
                FROM
                    v_parachain_vault_registration
                WHERE block_ts < '${new Date(dayBoundary).toISOString()}'\n
                union all\n`;
        }
        query = query.slice(0, -10); // last 'union all'
        const res = (await pool.query(query)).rows.sort(
            (a, b) => a.idx - b.idx
        );
        return res
            .map((row, i) => ({ date: dayBoundaries[i], count: row.count }))
            .reverse();
    } catch (e) {
        console.error(e);
        throw e;
    }
}

export async function getRecentDailyCollateral(
    daysBack: number
): Promise<CollateralTimeData[]> {
    try {
        let query = "";
        const dayBoundaries: number[] = [];
        for (let i = 0; i < daysBack; i++) {
            const dayBoundary = dateToMidnight(Date.now() - i * msInDay);
            dayBoundaries.push(dayBoundary);

            query += `SELECT
                    ${i} as idx,
                    sum(balance)
                FROM
                    (
                        select balance, block_ts from v_parachain_collateral_lock as l
                        union all
                        select balance * -1 as balance, block_ts from v_parachain_collateral_release as r
                        union all
                        select balance * -1 as balance, block_ts from v_parachain_collateral_slash as s
                    ) as un
                WHERE block_ts < '${new Date(dayBoundary).toISOString()}'\n
                union all\n`;
        }
        query = query.slice(0, -10); // last 'union all'
        const res = (await pool.query(query)).rows.sort(
            (a, b) => a.idx - b.idx
        );
        return res
            .map((row, i) => ({ date: dayBoundaries[i], amount: row.sum }))
            .reverse();
    } catch (e) {
        console.error(e);
        throw e;
    }
}
