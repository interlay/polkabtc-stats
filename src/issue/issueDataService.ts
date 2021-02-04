import format from "pg-format";
import { Issue } from "./issueModels";
import { SatoshisTimeData } from "../common/commonModels";

import pool from "../common/pool";
import { btcAddressToString, runPerDayQuery } from "../common/util";

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
        return (
            await runPerDayQuery(
                daysBack,
                (i, ts) =>
                    `SELECT
                    '${i}' AS idx,
                    coalesce(SUM(amount_btc::INTEGER), 0) AS value
                FROM
                    v_parachain_data_execute_issue AS ex
                    LEFT OUTER JOIN v_parachain_data_request_issue AS req
                        USING (issue_id)
                WHERE ex.block_ts < '${ts}'`
            )
        ).map((row) => ({ date: row.date, sat: row.value }));
    } catch (e) {
        console.error(e);
        throw e;
    }
}

export async function getPagedIssues(
    page: number,
    perPage: number,
    sortBy = "block_number",
    sortAsc = false
): Promise<Issue[]> {
    try {
        const res = await pool.query(
            `SELECT
                issue_id, amount_btc, block_number, block_ts, vault_id, btc_address, cancelled, executed
            FROM
                "v_parachain_data_request_issue"
                LEFT OUTER JOIN
                    (SELECT
                        issue_id, true AS cancelled
                    FROM "v_parachain_data_cancel_issue")
                AS cs USING (issue_id)
                LEFT OUTER JOIN
                    (SELECT
                        issue_id, true AS executed
                    FROM "v_parachain_data_execute_issue")
                AS es USING (issue_id)
            ORDER BY ${format.ident(sortBy)} ${
                sortAsc ? "ASC" : "DESC"
            }, issue_id ASC
            LIMIT $1 OFFSET $2`,
            [perPage, page * perPage]
        );
        return res.rows.map((row) => ({
            id: row.issue_id,
            amountBTC: row.amount_btc,
            creation: row.block_number,
            timestamp: row.block_ts,
            vaultBTCAddress: btcAddressToString(row.btc_address),
            vaultDOTAddress: row.vault_id,
            btcTxId: "",
            confirmations: 0,
            completed: row.executed ? true : false,
            cancelled: row.cancelled ? true : false,
        }));
    } catch (e) {
        console.error(e);
        throw e;
    }
}
