import { Issue, SatoshisTimeData } from "./issueModels";

import pool from "../common/pool";

function dateToMidnight(timestamp: number): number {
    const date = new Date(timestamp);
    date.setMilliseconds(0);
    date.setSeconds(0);
    date.setMinutes(0);
    date.setHours(0);
    return date.getTime();
}

export async function getSuccessfulIssues(): Promise<string> {
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

export async function getRecentDailyIssues(
    daysBack: number
): Promise<SatoshisTimeData[]> {
    try {
        let query = "";
        const msInDay = 86400 * 1000;
        const dayBoundaries: number[] = [];
        for (let i = 0; i < daysBack; i++) {
            const dayBoundary = dateToMidnight(Date.now() - i * msInDay);
            dayBoundaries.push(dayBoundary);
            query += `SELECT
                    '${i}' AS idx,
                    SUM(amount_btc::INTEGER)
                FROM
                    v_parachain_data_execute_issue AS ex
                    LEFT OUTER JOIN v_parachain_data_request_issue AS req
                        USING (issue_id)
                WHERE ex.block_ts < '${new Date(dayBoundary).toISOString()}'\n
                union all\n`;
        }
        query = query.slice(0, -10); // last 'union all'
        const res = (await pool.query(query)).rows.sort(
            (a, b) => a.idx - b.idx
        );
        return res
            .map((row, i) => ({ date: dayBoundaries[i], sat: row.sum }))
            .reverse();
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
                issue_id, amount_btc, block_number, vault_id, btc_address, cancelled, executed
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
            ORDER BY $1 ${sortAsc ? "ASC" : "DESC"}, issue_id ASC
            LIMIT $2 OFFSET $3`,
            [sortBy, perPage, page * perPage]
        );
        return res.rows.map((row) => ({
            id: row.issue_id,
            amountBTC: row.amount_btc,
            creation: row.block_number,
            vaultBTCAddress: row.btc_address,
            vaultDOTAddress: row.vault_id,
            btcTxId: "",
            confirmations: 0,
            completed: row.executed ? true : false,
            cancelled: row.cancelled ? true : false,
            fee: "",
            griefingCollateral: "",
        }));
    } catch (e) {
        console.error(e);
        throw e;
    }
}
