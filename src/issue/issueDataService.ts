import format from "pg-format";
import { Issue, IssueStats } from "./issueModels";
import { SatoshisTimeData } from "../common/commonModels";
import { planckToDOT, satToBTC, stripHexPrefix } from "@interlay/polkabtc";
import Big from "big.js";
import pool from "../common/pool";
import {
    btcAddressToString,
    BtcNetworkName,
    Filter,
    filtersToWhere,
} from "../common/util";
import { getTxDetailsForRequest, RequestType } from "../common/btcTxUtils";
import { IssueColumns } from "../common/columnTypes";
import logFn from "../common/logger";

export const logger = logFn({ name: "issueDataService" });

export async function getIssueStats(): Promise<IssueStats> {
    try {
        const res = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM v_parachain_data_request_issue) total,
                COUNT(*) successful,
                COALESCE(SUM(issued), 0) sum,
                MIN(issued),
                MAX(issued),
                percentile_cont(ARRAY[0.25, 0.5, 0.75]) WITHIN GROUP (ORDER BY issued) percentiles,
                stddev_pop(issued) stddev
                FROM
                (SELECT ex.amount_btc::BIGINT - req.fee_polkabtc::BIGINT issued
                    FROM v_parachain_data_execute_issue ex
                    JOIN v_parachain_data_request_issue req
                    USING (issue_id)
                ) iss
        `);
        const row = res.rows[0];
        const successful = new Big(row.successful);
        return {
            totalRequests: row.total,
            totalSuccesses: successful.toNumber(),
            totalPolkaBTCIssued: satToBTC(row.sum),
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

export async function getTotalSuccessfulIssues(): Promise<string> {
    try {
        const res = await pool.query(
            "select count(*) from v_parachain_executed_issues"
        );
        return res.rows[0].count;
    } catch (e) {
        logger.error(e);
        throw e;
    }
}

export async function getTotalIssues(
    filters: Filter<IssueColumns>[],
): Promise<number> {
    try {
        const res = await pool.query(
            `select count(*) from v_parachain_data_request_issue
            ${filtersToWhere<IssueColumns>(filters)}
            `
        );
        return Number(res.rows[0].count);
    } catch (e) {
        logger.error(e);
        throw e;
    }
}

export async function getRecentDailyTVL(
    days: number[]
): Promise<SatoshisTimeData[]> {
    try {
        return (
            await pool.query(
                `
            SELECT date, (issue - redeem) sat FROM
            (
                SELECT
                    extract(epoch from d.timestamp) * 1000 as date,
                    COALESCE(SUM(
                        (iex.amount_btc::BIGINT - ireq.fee_polkabtc::BIGINT)
                    ), 0) issue
                FROM
                    unnest($1::TIMESTAMP[]) d
                    LEFT OUTER JOIN v_parachain_data_execute_issue iex
                    LEFT OUTER JOIN v_parachain_data_request_issue ireq USING (issue_id)
                        ON d.timestamp >= iex.block_ts::timestamp
                GROUP BY 1
                ORDER BY 1 ASC
            ) i
            JOIN
            (
                SELECT
                    extract(epoch from d.timestamp) * 1000 as date,
                    COALESCE(SUM((rex.amount_polka_btc::BIGINT - rex.fee_polkabtc::BIGINT)
                    ), 0) redeem
                FROM
                    unnest($1::TIMESTAMP[]) d
                    LEFT OUTER JOIN v_parachain_redeem_execute rex
                    LEFT OUTER JOIN v_parachain_redeem_cancel rcan USING (redeem_id)
                        ON d.timestamp >= rex.block_ts::timestamp
                    WHERE (rcan.reimbursed IS NULL OR rcan.reimbursed = 'true')
                GROUP BY 1
                ORDER BY 1 ASC
            ) r USING (date)
        `,
                [days.map((ts) => new Date(ts))]
            )
        ).rows;
    } catch (e) {
        logger.error(e);
        throw e;
    }
}

export async function getRecentDailyIssues(
    daysBack: number
): Promise<SatoshisTimeData[]> {
    try {
        return (
            await pool.query(
                `
        SELECT extract(epoch from d.date) * 1000 as date, coalesce(SUM(ex.amount_btc::INTEGER), 0) AS sat
        FROM (SELECT (current_date - offs) AS date FROM generate_series(0, $1, 1) AS offs) d
        LEFT OUTER JOIN v_parachain_data_execute_issue AS ex LEFT OUTER JOIN v_parachain_data_request_issue AS req USING (issue_id)
        ON d.date >= ex.block_ts::date
        GROUP BY 1
        ORDER BY 1 ASC`,
                [daysBack]
            )
        ).rows.map((row) => ({ ...row, sat: Number(row.sat) }));
    } catch (e) {
        logger.error(e);
        throw e;
    }
}

export async function getPagedIssues(
    page: number,
    perPage: number,
    sortBy: IssueColumns,
    sortAsc: boolean,
    filters: Filter<IssueColumns>[],
    network: BtcNetworkName
): Promise<Issue[]> {
    try {
        const res = await pool.query(
            `SELECT
                req.issue_id, req.requester, req.fee_polkabtc, req.griefing_collateral, req.vault_wallet_pubkey, req.amount_btc, req.block_number, req.block_ts, req.vault_id, req.btc_address, cl.cancelled, ex.executed, ex.executed_amount, refund.refunded, refund.refund_btc_address, refund.refund_amount
            FROM
                "v_parachain_data_request_issue" as req
                LEFT OUTER JOIN
                    (SELECT
                        issue_id, true AS cancelled
                    FROM "v_parachain_data_cancel_issue")
                AS cl USING (issue_id)
                LEFT OUTER JOIN
                    (SELECT
                        issue_id, true AS executed, amount_btc as executed_amount
                    FROM "v_parachain_data_execute_issue")
                AS ex USING (issue_id)
                LEFT OUTER JOIN
                    (SELECT
                        issue_id, true AS refunded, 
                        btc_address AS refund_btc_address, 
                        amount AS refund_amount
                    FROM "v_parachain_refund_request")
                AS refund USING (issue_id)
            ${filtersToWhere<IssueColumns>(filters)}
            ORDER BY ${format.ident(sortBy)} ${
                sortAsc ? "ASC" : "DESC"
            }, issue_id ASC
            LIMIT $1 OFFSET $2`,
            [perPage, page * perPage]
        );
        return Promise.all(
            res.rows.map(async (row) => {
                console.log(network);
                const vaultBTCAddress = btcAddressToString(
                    row.btc_address,
                    network
                );
                const refundBtcAddress = row.refund_btc_address
                    ? btcAddressToString(row.refund_btc_address, network)
                    : "";
                const {
                    txid,
                    confirmations,
                    blockHeight,
                } = await getTxDetailsForRequest(
                    row.issue_id,
                    RequestType.Issue,
                    vaultBTCAddress
                );
                return {
                    id: stripHexPrefix(row.issue_id),
                    amountBTC: satToBTC(row.amount_btc),
                    requester: row.requester,
                    feePolkabtc: satToBTC(row.fee_polkabtc),
                    griefingCollateral: planckToDOT(row.griefing_collateral),
                    vaultWalletPubkey: stripHexPrefix(row.vault_wallet_pubkey),
                    creation: Number(row.block_number),
                    timestamp: row.block_ts.getTime().toString(),
                    vaultBTCAddress,
                    vaultDOTAddress: row.vault_id,
                    btcTxId: txid,
                    confirmations,
                    btcBlockHeight: blockHeight,
                    completed: row.executed ? true : false,
                    cancelled: row.cancelled ? true : false,
                    requestedRefund: row.refunded ? true : false,
                    executedAmountBTC: row.executed_amount
                        ? satToBTC(row.executed_amount)
                        : "",
                    refundBtcAddress,
                    refundAmountBTC: row.refund_amount
                        ? satToBTC(row.refund_amount)
                        : "",
                };
            })
        );
    } catch (e) {
        logger.error(e);
        throw e;
    }
}
