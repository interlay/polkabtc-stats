import {
    VaultData,
    CollateralTimeData,
    VaultCountTimeData,
    VaultSlaRanking,
} from "./vaultModels";
import {
    getDurationAboveMinSla,
    hexStringFixedPointToBig,
    runPerDayQuery
} from "../common/util";
import pool from "../common/pool";
import Big from "big.js";
import { planckToDOT } from "@interlay/polkabtc";
import { getPolkaBtc } from "../common/polkaBtc";
import pino from "pino";

export const logger = pino({ name: 'vaultDataService' });

export async function getRecentDailyVaults(
    daysBack: number
): Promise<VaultCountTimeData[]> {
    try {
        return (await pool.query(`
        SELECT extract(epoch from d.date) * 1000 as date, count(v.vault_id) as value
        FROM (SELECT (current_date - offs) AS date FROM generate_series(0, $1, 1) AS offs) d
        LEFT OUTER JOIN v_parachain_vault_registration v
        ON d.date = v.block_ts::date
        GROUP BY 1
        ORDER BY 1 ASC`, [daysBack]))
            .rows
            .map((row) => ({ date: row.date, count: row.value }));
    } catch (e) {
        logger.error(e);
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
        const polkaBtc = await getPolkaBtc();
        const reducedRows: VaultSlaRanking[] = res.rows.map((row) => ({
            id: row.vault_id,
            duration: getDurationAboveMinSla(
                polkaBtc.api,
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
        logger.error(e);
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
        (SELECT COUNT(DISTINCT issue_id) count FROM v_parachain_data_request_issue WHERE vault_id = reg.vault_id) AS request_issue_count,
        (SELECT COUNT(DISTINCT issue_id) count FROM v_parachain_data_execute_issue WHERE vault_id = reg.vault_id) AS execute_issue_count,
        (SELECT COUNT(DISTINCT redeem_id) count FROM v_parachain_redeem_request WHERE vault_id = reg.vault_id) AS request_redeem_count,
        (SELECT COUNT(DISTINCT redeem_id) count FROM v_parachain_redeem_execute WHERE vault_id = reg.vault_id) AS execute_redeem_count,
        (SELECT COUNT(DISTINCT redeem_id) count FROM v_parachain_redeem_cancel WHERE vault_id = reg.vault_id) AS cancel_redeem_count,
        (SELECT array_agg(delta) lifetime_sla_change
                FROM v_parachain_vault_sla_update
                WHERE vault_id = reg.vault_id
                GROUP BY vault_id) AS lifetime_sla_change
        FROM (
            SELECT vault_id, collateral, block_number
            FROM v_parachain_vault_registration
            UNION
            SELECT vault_id, total_collateral, block_number
            FROM v_parachain_vault_collateral
        ) reg
        ORDER BY reg.vault_id, reg.block_number DESC
        `);
        const polkaBtc = await getPolkaBtc();
        return res.rows.map((row) => ({
            id: row.vault_id,
            collateral: planckToDOT(row.collateral),
            request_issue_count: row.request_issue_count,
            execute_issue_count: row.execute_issue_count,
            request_redeem_count: row.request_redeem_count,
            execute_redeem_count: row.execute_redeem_count,
            cancel_redeem_count: row.cancel_redeem_count,
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
        }));
    } catch (e) {
        logger.error(e);
        throw e;
    }
}
