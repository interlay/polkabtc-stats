import { CollateralTimeData, VaultCountTimeData } from "./vaultModels";
import { runPerDayQuery } from "../common/util";

export async function getRecentDailyVaults(
    daysBack: number
): Promise<VaultCountTimeData[]> {
    try {
        return runPerDayQuery(
            daysBack,
            (i, ts) =>
                `SELECT
                    '${i}' AS idx,
                    COUNT(*)
                FROM
                    v_parachain_vault_registration
                WHERE block_ts < '${ts}`
        );
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
                        sum(balance)
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
        ).map((row) => ({ date: row.date, amount: row.count }));
    } catch (e) {
        console.error(e);
        throw e;
    }
}