import { VaultData, CollateralTimeData, VaultCountTimeData } from "./vaultModels";
import { runPerDayQuery } from "../common/util";
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
                reg.collateral,
                COALESCE(request_issue.count, 0) AS request_issue_count,
                COALESCE(execute_issue.count, 0) AS execute_issue_count,
                COALESCE(request_redeem.count, 0) AS request_redeem_count,
                COALESCE(execute_redeem.count, 0) AS execute_redeem_count,
                COALESCE(cancel_redeem.count, 0) AS cancel_redeem_count
            FROM (
                SELECT vault_id, collateral, block_number
                FROM v_parachain_vault_registration
                UNION
                SELECT vault_id, total_collateral, block_number
                FROM v_parachain_vault_collateral
            ) reg
            LEFT OUTER JOIN
              (
                SELECT vault_id, COUNT(DISTINCT issue_id) count
                FROM v_parachain_data_request_issue
                GROUP BY vault_id, issue_id
              ) request_issue
            ON reg.vault_id = request_issue.vault_id
            LEFT OUTER JOIN
              (
                SELECT vault_id, COUNT(DISTINCT issue_id) count
                FROM v_parachain_data_execute_issue
                GROUP BY vault_id, issue_id
              ) execute_issue
            ON reg.vault_id = execute_issue.vault_id
            LEFT OUTER JOIN
              (
                SELECT vault_id, COUNT(DISTINCT redeem_id) count
                FROM v_parachain_redeem_request
                GROUP BY vault_id, redeem_id
              ) request_redeem
            ON reg.vault_id = request_redeem.vault_id
            LEFT OUTER JOIN
              (
                SELECT vault_id, COUNT(DISTINCT redeem_id) count
                FROM v_parachain_redeem_execute
                GROUP BY vault_id, redeem_id
              ) execute_redeem
            ON reg.vault_id = execute_redeem.vault_id
            LEFT OUTER JOIN
              (
                SELECT vault_id, COUNT(DISTINCT redeem_id) count
                FROM v_parachain_redeem_cancel
                GROUP BY vault_id, redeem_id
              ) cancel_redeem
            ON reg.vault_id = cancel_redeem.vault_id
            ORDER BY reg.vault_id, reg.block_number DESC
        `);
        return res.rows.map((row) => ({
            id: row.vault_id,
            collateral: planckToDOT(row.collateral),
            request_issue_count: row.request_issue_count,
            execute_issue_count: row.execute_issue_count,
            request_redeem_count: row.request_redeem_count,
            execute_redeem_count: row.execute_redeem_count,
            cancel_redeem_count: row.cancel_redeem_count,
        }));
    } catch (e) {
        console.error(e);
        throw e;
    }
}
