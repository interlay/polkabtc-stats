import format from "pg-format";
import { Redeem, RedeemStats } from "./redeemModel";
import { SatoshisTimeData } from "../common/commonModels";
import Big from "big.js";
import pool from "../common/pool";
import {
    btcAddressToString,
    BtcNetworkName,
    Filter,
    filtersToWhere,
} from "../common/util";
import { getTxDetailsForRequest, RequestType } from "../common/btcTxUtils";
import { planckToDOT, satToBTC, stripHexPrefix } from "@interlay/polkabtc";
import { RedeemColumns } from "../common/columnTypes";
import logFn from "../common/logger";

export const logger = logFn({ name: "redeemDataService" });

export async function getRedeemStats(): Promise<RedeemStats> {
    try {
        const res = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM v_parachain_redeem_request) total,
                (SELECT COUNT(*) FROM v_parachain_redeem_request WHERE dot_premium::BIGINT != 0) total_premium,
                (SELECT COUNT(*) FROM v_parachain_redeem_liquidate) total_liquidated,
                COUNT(*) successful,
                COALESCE(SUM(redeemed), 0) sum,
                MIN(redeemed),
                MAX(redeemed),
                percentile_cont(ARRAY[0.25, 0.5, 0.75]) WITHIN GROUP (ORDER BY redeemed) percentiles,
                stddev_pop(redeemed) stddev
                FROM
                (SELECT amount_polka_btc::BIGINT - fee_polkabtc::BIGINT redeemed
                    FROM v_parachain_redeem_execute
                    LEFT OUTER JOIN v_parachain_redeem_cancel USING (redeem_id)
                    WHERE reimbursed IS NULL OR reimbursed = 'true'
                ) red
        `);
        const row = res.rows[0];
        const successful = new Big(row.successful);
        return {
            totalRequests: row.total,
            totalSuccesses: successful.toNumber(),
            totalPremium: row.total_premium,
            premiumFraction: new Big(row.total_premium)
                .div(row.total)
                .toNumber(),
            totalLiquidated: row.total_liquidated,
            liquidatedFraction: new Big(row.total_liquidated)
                .div(row.total)
                .toNumber(),
            totalPolkaBTCRedeemed: satToBTC(row.sum),
            averageRequest: {
                min: satToBTC(row.min),
                max: satToBTC(row.max),
                mean: successful.eq(0)
                    ? "0"
                    : new Big(satToBTC(row.sum)).div(successful).toString(),
                stddev: satToBTC(row.stddev),
                percentiles: {
                    quarter: satToBTC(row.percentiles[0]),
                    median: satToBTC(row.percentiles[1]),
                    threeQuarter: satToBTC(row.percentiles[2]),
                },
            },
        };
    } catch (e) {
        logger.error(e);
        throw e;
    }
}
export async function getTotalSuccessfulRedeems(): Promise<string> {
    try {
        const res = await pool.query(
            "select count(*) from v_parachain_redeem_execute"
        );
        return res.rows[0].count;
    } catch (e) {
        logger.error(e);
        throw e;
    }
}

export async function getTotalRedeems(
    filters: Filter<RedeemColumns>[],
): Promise<number> {
    try {
        const res = await pool.query(
            `select count(*) from v_parachain_redeem_request
            ${filtersToWhere<RedeemColumns>(filters)}
            `
        );
        return res.rows[0].count;
    } catch (e) {
        logger.error(e);
        throw e;
    }
}

export async function getTotalAmount(): Promise<string> {
    try {
        const res = await pool.query(`
            SELECT
                coalesce(sum(req.amount_polka_btc::integer), 0) as sum
            FROM
                "v_parachain_redeem_request" as req
                INNER JOIN "v_parachain_redeem_execute"
                    USING (redeem_id)`);
        return res.rows[0].sum;
    } catch (e) {
        logger.error(e);
        throw e;
    }
}

export async function getRecentDailyRedeems(
    daysBack: number
): Promise<SatoshisTimeData[]> {
    try {
        return (
            await pool.query(
                `
        SELECT extract(epoch from d.date) * 1000 as date, coalesce(SUM(ex.amount_polka_btc::INTEGER), 0) AS sat
        FROM (SELECT (current_date - offs) AS date FROM generate_series(0, $1, 1) AS offs) d
        LEFT OUTER JOIN v_parachain_redeem_execute AS ex LEFT OUTER JOIN v_parachain_redeem_request AS req USING (redeem_id)
        ON d.date >= ex.block_ts::date
        GROUP BY 1
        ORDER BY 1 ASC
            `,
                [daysBack]
            )
        ).rows.map((row) => ({ ...row, sat: Number(row.sat) }));
    } catch (e) {
        logger.error(e);
        throw e;
    }
}

export async function getPagedRedeems(
    page: number,
    perPage: number,
    sortBy: RedeemColumns,
    sortAsc: boolean,
    filters: Filter<RedeemColumns>[],
    network: BtcNetworkName
): Promise<Redeem[]> {
    try {
        const res = await pool.query(
            `
            SELECT
                req.redeem_id, req.requester, req.amount_polka_btc, req.fee_polkabtc, req.dot_premium, req.block_number, req.block_ts, cl.reimbursed, req.vault_id, req.btc_address, cl.cancelled, ex.executed
            FROM
                "v_parachain_redeem_request" as req
                LEFT OUTER JOIN
                    (SELECT
                        redeem_id, reimbursed, true AS cancelled
                    FROM "v_parachain_redeem_cancel")
                AS cl USING (redeem_id)
                LEFT OUTER JOIN
                    (SELECT
                        redeem_id, true AS executed
                    FROM "v_parachain_redeem_execute")
                AS ex USING (redeem_id)
            ${filtersToWhere<RedeemColumns>(filters)}
            ORDER BY ${format.ident(sortBy)} ${
                sortAsc ? "ASC" : "DESC"
            }, redeem_id ASC
            LIMIT $1 OFFSET $2
            `,
            [perPage, page * perPage]
        );
        return Promise.all(
            res.rows.map(async (row) => {
                const userBtcAddress = btcAddressToString(
                    row.btc_address,
                    network
                );
                const {
                    txid,
                    confirmations,
                    blockHeight,
                } = await getTxDetailsForRequest(
                    row.redeem_id,
                    RequestType.Redeem,
                    userBtcAddress,
                    true
                );
                return {
                    id: stripHexPrefix(row.redeem_id),
                    requester: row.requester,
                    amountPolkaBTC: satToBTC(row.amount_polka_btc),
                    feePolkabtc: satToBTC(row.fee_polkabtc),
                    dotPremium: planckToDOT(row.dot_premium),
                    creation: Number(row.block_number),
                    timestamp: row.block_ts.getTime().toString(),
                    btcAddress: userBtcAddress,
                    vaultDotAddress: row.vault_id,
                    btcTxId: txid,
                    confirmations,
                    btcBlockHeight: blockHeight,
                    completed: row.executed ? true : false,
                    cancelled: row.cancelled ? true : false,
                    reimbursed: row.reimbursed === "true" ? true : false,
                    isExpired: false,
                };
            })
        );
    } catch (e) {
        logger.error({ err: e }, "[REDEEM] getPagedRedeems: uncaught error");
        throw e;
    }
}
