import format from "pg-format";
import { Issue } from "./issueModels";
import { SatoshisTimeData } from "../common/commonModels";
import { planckToDOT, satToBTC, stripHexPrefix } from "@interlay/polkabtc";

import pool from "../common/pool";
import {
    btcAddressToString,
    BtcNetworkName,
    Filter,
    filtersToWhere
} from "../common/util";
import { getTxDetailsForRequest, RequestType } from "../common/btcTxUtils";
import { IssueColumns } from "../common/columnTypes";

export async function getTotalSuccessfulIssues(): Promise<string> {
    try {
        const res = await pool.query(
            "select count(*) from v_parachain_executed_issues"
        );
        return res.rows[0].count;
    } catch (e) {
        console.error(e);
        throw e;
    }
}

export async function getTotalIssues(): Promise<string> {
    try {
        const res = await pool.query(
            "select count(*) from v_parachain_data_request_issue"
        );
        return res.rows[0].count;
    } catch (e) {
        console.error(e);
        throw e;
    }
}

export async function getRecentDailyIssues(
    daysBack: number
): Promise<SatoshisTimeData[]> {
    try {
        return (await pool.query(`
        SELECT extract(epoch from d.date) * 1000 as date, coalesce(SUM(ex.amount_btc::INTEGER), 0) AS sat
        FROM (SELECT (current_date - offs) AS date FROM generate_series(0, $1, 1) AS offs) d
        LEFT OUTER JOIN v_parachain_data_execute_issue AS ex LEFT OUTER JOIN v_parachain_data_request_issue AS req USING (issue_id)
        ON d.date = ex.block_ts::date
        GROUP BY 1
        ORDER BY 1 ASC`, [daysBack]))
            .rows
            .map((row) => ({ date: row.date, sat: row.sat }));
    } catch (e) {
        console.error(e);
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
                    creation: row.block_number,
                    timestamp: row.block_ts,
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
        console.error("[ISSUE] getPagedIssues: uncaught error");
        console.error(e);
        throw e;
    }
}
