import {
    VaultChallengeData,
    CollateralTimeData,
    VaultCountTimeData,
    VaultSlaRanking,
    VaultData,
} from "./vaultModels";
import {
    Filter,
    filtersToWhere,
    getDurationAboveMinSla,
    hexStringFixedPointToBig,
    runPerDayQuery,
} from "../common/util";
import pool from "../common/pool";
import Big from "big.js";
import { planckToDOT, satToBTC } from "@interlay/polkabtc";
import logFn from "../common/logger";
import { VaultStats } from "./vaultModels";
import { VaultChallengeColumns, VaultColumns } from "../common/columnTypes";
import { parachainConstants } from "../parachainConstants/constantsService";
import format from "pg-format";

export const logger = logFn({ name: "vaultDataService" });

export async function getVaultCollateralisationsAtTime(
    timestamp: number
): Promise<string[]> {
    try {
        const res = await pool.query(
            `
            SELECT
                COALESCE(issued - redeemed, 0) tokens,
                vault_id,
                COALESCE(col, reg.collateral) col,
                (SELECT "event_data" ->> 1 AS rate
                FROM v_parachain_data
                WHERE section='exchangeRateOracle'::text
                    AND method='SetExchangeRate'::text
                    AND block_ts < $1
                ORDER BY block_ts DESC LIMIT 1)
            FROM
                (SELECT * FROM v_parachain_vault_registration
                    WHERE block_ts < $1
                ) reg
                LEFT OUTER JOIN
                (SELECT DISTINCT vault_id,
                        first_value(total_collateral)OVER (PARTITION BY vault_id ORDER BY block_ts desc) col
                    FROM v_parachain_vault_collateral
                    WHERE block_ts < $1
                ) c USING (vault_id)
                LEFT OUTER JOIN
                (SELECT COALESCE (SUM(ex.amount_btc::BIGINT - req.fee_polkabtc::BIGINT), 0) issued, ex.vault_id
                    FROM v_parachain_data_execute_issue ex
                    JOIN v_parachain_data_request_issue req
                    USING (issue_id)
                    WHERE ex.block_ts < $1
                    GROUP BY ex.vault_id
                ) iss USING (vault_id)
                LEFT OUTER JOIN
                (SELECT COALESCE(SUM(req.amount_polka_btc::BIGINT - req.fee_polkabtc::BIGINT), 0) redeemed, ex.vault_id
                    FROM v_parachain_redeem_request req
                    JOIN v_parachain_redeem_execute ex USING (redeem_id)
                    LEFT OUTER JOIN v_parachain_redeem_cancel USING (redeem_id)
                    WHERE (reimbursed IS NULL OR reimbursed = 'true') AND ex.block_ts < $1
                    GROUP BY ex.vault_id
                ) red USING (vault_id)
        `,
            [new Date(timestamp)]
        );

        const rates = res.rows.map((row) => {
            const exchangeRate = hexStringFixedPointToBig(row.rate);
            const collateral = new Big(row.col ? row.col : 0);
            const collateralInPolkaBTC = exchangeRate.eq(0)
                ? new Big(0)
                : collateral.div(exchangeRate);
            const tokens = new Big(row.tokens);
            return tokens.eq(0)
                ? "0"
                : collateralInPolkaBTC.div(tokens).toString();
        });
        return rates;
    } catch (e) {
        logger.error(e);
        throw e;
    }
}

export async function getVaultStats(): Promise<VaultStats> {
    try {
        const res = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM v_parachain_vault_registration) total_registered,
                (SELECT COUNT(DISTINCT vault_id) FROM v_parachain_vault_theft) total_thefts,
                (SELECT COUNT(*) FROM v_parachain_vault_theft) total_thieves,
                (SELECT COUNT(*) FROM v_parachain_vault_liquidation) total_liquidations,
                (SELECT COALESCE(SUM(issued_btc::BIGINT), 0) FROM v_parachain_vault_liquidation) btc_liquidated,
                (SELECT COALESCE(SUM(collateral_dot::BIGINT), 0) FROM v_parachain_vault_liquidation) dot_liquidated,
                (SELECT issued - redeemed FROM
                    (SELECT COALESCE (SUM(ex.amount_btc::BIGINT - req.fee_polkabtc::BIGINT), 0) issued
                        FROM v_parachain_data_execute_issue ex
                        JOIN v_parachain_data_request_issue req
                        USING (issue_id)
                    ) iss,
                    (SELECT COALESCE(SUM(amount_polka_btc::BIGINT - fee_polkabtc::BIGINT), 0) redeemed
                        FROM v_parachain_redeem_request
                        LEFT OUTER JOIN v_parachain_redeem_cancel USING (redeem_id)
                        WHERE reimbursed IS NULL OR reimbursed = 'true')
                    red) total_tokens,
                COALESCE(SUM(collateral), 0) sum,
                MIN(collateral),
                MAX(collateral),
                percentile_cont(ARRAY[0.25, 0.5, 0.75]) WITHIN GROUP (ORDER BY collateral) percentiles,
                stddev_pop(collateral) stddev
            FROM
            (SELECT DISTINCT ON (vault_id) collateral::BIGINT
                FROM (
                    SELECT vault_id, collateral, block_ts
                    FROM v_parachain_vault_registration
                    UNION
                    SELECT vault_id, total_collateral AS collateral, block_ts
                    FROM v_parachain_vault_collateral
                ) c
            ORDER BY vault_id, block_ts DESC) col
        `);
        const row = res.rows[0];
        const registrations = new Big(row.total_registered);
        const sum = new Big(planckToDOT(row.sum));
        const totalTokens = new Big(row.total_tokens);
        return {
            total: registrations.toNumber(),
            thefts: row.total_thefts,
            thiefVaults: row.total_thieves,
            liquidations: {
                count: row.total_liquidations,
                btcFraction: totalTokens.eq(0)
                    ? 0
                    : new Big(row.btc_liquidated).div(totalTokens).toNumber(),
                dotFraction: sum.eq(0)
                    ? 0
                    : new Big(planckToDOT(row.dot_liquidated))
                          .div(sum)
                          .toNumber(),
            },
            collateralDistribution: {
                min: planckToDOT(row.min),
                max: planckToDOT(row.max),
                mean: registrations.eq(0)
                    ? "0"
                    : sum.div(registrations).toString(),
                stddev: planckToDOT(row.stddev),
                percentiles: {
                    quarter: planckToDOT(row.percentiles[0]),
                    median: planckToDOT(row.percentiles[1]),
                    threeQuarter: planckToDOT(row.percentiles[2]),
                },
            },
        };
    } catch (e) {
        logger.error(e);
        throw e;
    }
}

export async function getRecentDailyVaults(
    daysBack: number
): Promise<VaultCountTimeData[]> {
    try {
        return (
            await pool.query(
                `
        SELECT extract(epoch from d.date) * 1000 as date, count(v.vault_id) as value
        FROM (SELECT (current_date - offs) AS date FROM generate_series(0, $1, 1) AS offs) d
        LEFT OUTER JOIN v_parachain_vault_registration v
        ON d.date >= v.block_ts::date
        GROUP BY 1
        ORDER BY 1 ASC`,
                [daysBack]
            )
        ).rows.map((row) => ({ date: row.date, count: Number(row.value) }));
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
        const reducedRows: VaultSlaRanking[] = res.rows.map((row) => ({
            id: row.vault_id,
            duration: getDurationAboveMinSla(minSla, row.sla_changes),
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
                (i, ts) => `
                    SELECT
                        ${i} as idx,
                        coalesce(sum(collateral::BIGINT), 0) AS value
                    FROM (
                        SELECT DISTINCT ON (vault_id)
                            vault_id,
                            collateral,
                            block_ts
                        FROM (
                            SELECT
                                vault_id,
                                collateral,
                                block_ts
                            FROM v_parachain_vault_registration
                            UNION
                            SELECT
                                vault_id,
                                total_collateral AS collateral,
                                block_ts
                                FROM v_parachain_vault_collateral
                        ) col) as un
                    WHERE block_ts < '${ts}'`
            )
        ).map((row) => ({ date: row.date, amount: new Big(row.value) }));
    } catch (e) {
        logger.error(e);
        throw e;
    }
}

export async function getAllVaults(
    page: number,
    perPage: number,
    sortBy: VaultColumns,
    sortAsc: boolean,
    filters: Filter<VaultColumns>[]
): Promise<VaultData[]> {
    try {
        const res = await pool.query(
            `
            SELECT
                vaults.vault_id,
                vaults.collateral,
                reg.block_ts AS registration_ts,
                COALESCE ((
                    SELECT
                        TRUE
                    FROM v_parachain_vault_theft
                    WHERE vault_id = vaults.vault_id
                ), FALSE) AS committed_theft,
                COALESCE ((
                    SELECT
                        TRUE
                    FROM v_parachain_vault_liquidation
                    WHERE vault_id = vaults.vault_id
                ), FALSE) AS liquidated,
                COALESCE ((
                    SELECT
                        MAX(("event_data" ->> 1)::BIGINT)
                    FROM "v_parachain_data"
                    WHERE "section"='vaultRegistry'::text
                        AND "method"='BanVault'::text
                        AND ("event_data" ->> 0) = vaults.vault_id
                ), 0) AS banned_until,
                COALESCE ((
                    SELECT
                        SUM(ex.amount_btc::BIGINT - req.fee_polkabtc::BIGINT)
                    FROM v_parachain_data_execute_issue ex
                        JOIN v_parachain_data_request_issue req
                        USING (issue_id)
                    WHERE ex.vault_id = vaults.vault_id
                ), 0) AS executed_issues,
                COALESCE ((
                    SELECT
                        SUM(COALESCE(fee::BIGINT, 0))
                    FROM v_parachain_refund_execute ex
                        JOIN v_parachain_refund_request
                        USING (refund_id)
                    WHERE ex.vault = vaults.vault_id
                ), 0) AS received_refunds,
                COALESCE ((
                    SELECT
                        SUM(amount_polka_btc::BIGINT - fee_polkabtc::BIGINT)
                    FROM v_parachain_redeem_execute ex
                    WHERE ex.vault_id = vaults.vault_id
                ), 0) AS executed_redeems,
                COALESCE ((
                    SELECT
                        SUM(req.amount_polka_btc::BIGINT)
                    FROM v_parachain_redeem_cancel c
                        JOIN v_parachain_redeem_request req
                        USING (redeem_id)
                    WHERE c.reimbursed = 'true'
                        AND c.vault_id = vaults.vault_id
                ), 0) AS reimbursed_redeems,
                COALESCE ((
                    SELECT
                        SUM(amount_btc::BIGINT)
                    FROM v_parachain_data_request_issue r
                        LEFT OUTER JOIN v_parachain_data_cancel_issue c
                        USING (issue_id)
                    WHERE c.issue_id IS NULL
                        AND r.vault_id = vaults.vault_id
                ), 0) AS requested_issues
            FROM (
                SELECT DISTINCT ON (vault_id)
                    vault_id,
                    collateral
                FROM (
                    SELECT
                        vault_id,
                        collateral,
                        block_ts
                    FROM v_parachain_vault_registration
                    UNION
                    SELECT
                        vault_id,
                        total_collateral AS collateral,
                        block_ts
                    FROM v_parachain_vault_collateral
                ) col
                ORDER BY vault_id, block_ts DESC
            ) vaults
            JOIN v_parachain_vault_registration reg USING (vault_id)
            ${filtersToWhere<VaultColumns>(filters)}
            ORDER BY ${format.ident(sortBy)} ${sortAsc ? "ASC" : "DESC"}
            LIMIT $1 OFFSET $2
            `,
            [perPage, page * perPage]
        );
        const exchangeRateRes = await pool.query(
            `select exchange_rate from v_parachain_oracle_set_exchange_rate order by block_ts desc limit 1`
        );
        if (exchangeRateRes.rows.length === 0) {
            // no oracle updates ever
            throw new Error("No exchange rate data.");
        }
        const latestblock = (
            await pool.query(
                `select max(block_number) block from parachain_events`
            )
        ).rows[0].block;
        const exchangeRate = hexStringFixedPointToBig(
            exchangeRateRes.rows[0].exchange_rate
        );
        const secureCollateralThreshold = (await parachainConstants)
            .secureCollateralThreshold;
        return res.rows.map((row) => {
            const collateral = new Big(planckToDOT(row.collateral));
            const convertedCollateral = collateral.div(exchangeRate);
            const lockedSat =
                Number(row.executed_issues) +
                Number(row.received_refunds) -
                Number(row.executed_redeems) -
                Number(row.reimbursed_redeems);
            const lockedBTC = Number(satToBTC(lockedSat.toString()));
            const pendingSat =
                Number(row.requested_issues) - Number(row.executed_issues);
            const pendingBTC = Number(satToBTC(pendingSat.toString()));
            const capacity = convertedCollateral
                .div(secureCollateralThreshold)
                .sub(lockedBTC);
            return {
                id: row.vault_id,
                collateral,
                lockedBTC,
                pendingBTC,
                collateralization:
                    lockedBTC === 0
                        ? NaN
                        : convertedCollateral.div(lockedBTC).toNumber(),
                pendingCollateralization:
                    lockedBTC + pendingBTC === 0
                        ? NaN
                        : convertedCollateral
                              .div(lockedBTC + pendingBTC)
                              .toNumber(),
                capacity,
                registeredAt: row.registration_ts,
                status: {
                    committedTheft: row.committed_theft,
                    liquidated: row.liquidated,
                    banned:
                        Number(row.banned_until) > latestblock
                            ? Number(row.banned_until)
                            : undefined,
                },
            };
        });
    } catch (e) {
        logger.error(e);
        throw e;
    }
}

export async function getChallengeVaults(
    page: number,
    perPage: number,
    sortBy: VaultChallengeColumns,
    sortAsc: boolean,
    filters: Filter<VaultChallengeColumns>[],
    slaSince: number
): Promise<VaultChallengeData[]> {
    try {
        const res = await pool.query(
            `
        SELECT DISTINCT ON (reg.vault_id)
        reg.vault_id,
        reg.block_number,
        reg.collateral,
        (SELECT COUNT(DISTINCT issue_id) count FROM v_parachain_data_request_issue WHERE vault_id = reg.vault_id AND block_ts > $3) AS request_issue_count,
        (SELECT COUNT(DISTINCT issue_id) count FROM v_parachain_data_execute_issue WHERE vault_id = reg.vault_id AND block_ts > $3) AS execute_issue_count,
        (SELECT COUNT(DISTINCT redeem_id) count FROM v_parachain_redeem_request WHERE vault_id = reg.vault_id AND block_ts > $3) AS request_redeem_count,
        (SELECT COUNT(DISTINCT redeem_id) count FROM v_parachain_redeem_execute WHERE vault_id = reg.vault_id AND block_ts > $3) AS execute_redeem_count,
        (SELECT COUNT(DISTINCT redeem_id) count FROM v_parachain_redeem_cancel WHERE vault_id = reg.vault_id AND block_ts > $3) AS cancel_redeem_count,
        coalesce((SELECT sum(delta::BIGINT) as lifetime_sla_change FROM v_parachain_vault_sla_update_v2 WHERE vault_id = reg.vault_id AND block_ts > $3 GROUP BY vault_id), 0) AS lifetime_sla_change
        FROM (
            SELECT vault_id, collateral, block_number
            FROM v_parachain_vault_registration
            UNION
            SELECT vault_id, total_collateral, block_number
            FROM v_parachain_vault_collateral
        ) reg
        ${filtersToWhere<VaultChallengeColumns>(filters)}
        ORDER BY reg.vault_id DESC, reg.block_number DESC,
        ${format.ident(sortBy)} ${sortAsc ? "ASC" : "DESC"}
        LIMIT $1 OFFSET $2
        `,
            [perPage, page * perPage, new Date(slaSince)]
        );
        return res.rows.map((row) => ({
            id: row.vault_id,
            collateral: planckToDOT(row.collateral),
            request_issue_count: row.request_issue_count,
            execute_issue_count: row.execute_issue_count,
            request_redeem_count: row.request_redeem_count,
            execute_redeem_count: row.execute_redeem_count,
            cancel_redeem_count: row.cancel_redeem_count,
            lifetime_sla: row.lifetime_sla_change,
        }));
    } catch (e) {
        logger.error(e);
        throw e;
    }
}
