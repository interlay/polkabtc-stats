import {
    VaultData,
    CollateralTimeData,
    VaultCountTimeData,
    VaultSlaRanking,
} from "./vaultModels";
import { getDurationAboveMinSla, runPerDayQuery } from "../common/util";
import pool from "../common/pool";
import { planckToDOT } from "@interlay/polkabtc";

export async function getRecentDailyVaults(
    daysBack: number
): Promise<VaultCountTimeData[]> {
    try {
        return (
            await runPerDayQuery(
                daysBack,
                (i, ts) =>
                    `SELECT
                    ${i} AS idx,
                    COUNT(*) AS value
                FROM
                    v_parachain_vault_registration
                WHERE block_ts < '${ts}'`
            )
        ).map((row) => ({ date: row.date, count: row.value }));
    } catch (e) {
        console.error(e);
        throw e;
    }
}

export async function getVaultsWithTrackRecord(
    minSla: number,
    consecutiveTimespan: number
): Promise<VaultSlaRanking[]> {
    try {
        const res = await pool.query(`
            SELECT
                vault_id,
                json_agg(row(new_sla, block_ts)) as sla_changes
            FROM v_parachain_vault_sla_update
            GROUP BY vault_id
            `);
        const reducedRows: VaultSlaRanking[] = res.rows.map((row) => ({
            id: row.vault_id,
            duration: getDurationAboveMinSla(minSla, row.sla_changes),
            threshold: minSla,
        }));
        return reducedRows.filter((row) => row.duration >= consecutiveTimespan);
    } catch (e) {
        console.error(e);
        throw e;
    }
}

export async function getRecentDailyCollateral(
    daysBack: number
): Promise<CollateralTimeData[]> {
    try {
        return (
            await runPerDayQuery(
                daysBack,
                (i, ts) =>
                    `SELECT
                        ${i} as idx,
                        coalesce(sum(balance), 0) AS value
                    FROM
                        (
                            select balance, block_ts from v_parachain_collateral_lock as l
                            union all
                            select balance * -1 as balance, block_ts from v_parachain_collateral_release as r
                            union all
                            select balance * -1 as balance, block_ts from v_parachain_collateral_slash as s
                        ) as un
                    WHERE block_ts < '${ts}'`
            )
        ).map((row) => ({ date: row.date, amount: row.value }));
    } catch (e) {
        console.error(e);
        throw e;
    }
}

export async function getAllVaults(): Promise<VaultData[]> {
    try {
        const res = await pool.query(`
            SELECT DISTINCT ON (reg.vault_id)
                reg.vault_id,
                reg.block_number,
                reg.collateral
            FROM (
                SELECT vault_id, collateral, block_number
                FROM v_parachain_vault_registration
                UNION
                SELECT vault_id, total_collateral, block_number
                FROM v_parachain_vault_collateral
            ) reg 
            ORDER BY reg.vault_id, reg.block_number DESC
        `);
        return res.rows.map((row) => ({
            id: row.vault_id,
            collateral: planckToDOT(row.collateral),
        }));
    } catch (e) {
        console.error(e);
        throw e;
    }
}
