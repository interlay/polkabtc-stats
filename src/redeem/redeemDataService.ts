import format from "pg-format";
import { Redeem } from "./redeemModel";
import { SatoshisTimeData } from "../common/commonModels";

import pool from "../common/pool";
import { btcAddressToString, BtcNetworkName, runPerDayQuery } from "../common/util";

export async function getTotalSuccessfulRedeems(): Promise<string> {
    try {
        const res = await pool.query(
            "select count(*) from v_parachain_redeem_execute"
        );
        return res.rows[0].count;
    } catch (e) {
        console.error(e);
        throw e;
    }
}

export async function getTotalRedeems(): Promise<string> {
    try {
        const res = await pool.query(
            "select count(*) from v_parachain_redeem_request"
        );
        return res.rows[0].count;
    } catch (e) {
        console.error(e);
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
        console.error(e);
        throw e;
    }
}

export async function getRecentDailyRedeems(
    daysBack: number
): Promise<SatoshisTimeData[]> {
    try {
        return (
            await runPerDayQuery(
                daysBack,
                (i, ts) =>
                    `SELECT
                        '${i}' AS idx,
                        coalesce(SUM(ex.amount_polka_btc::INTEGER), 0) AS value
                    FROM
                        v_parachain_redeem_execute AS ex
                        LEFT OUTER JOIN v_parachain_redeem_request AS req
                            USING (redeem_id)
                    WHERE ex.block_ts < '${ts}'`
            )
        ).map((row) => ({ date: row.date, sat: row.value }));
    } catch (e) {
        console.error(e);
        throw e;
    }
}

export async function getPagedRedeems(
    page: number,
    perPage: number,
    sortBy = "block_number",
    sortAsc = false,
    network: BtcNetworkName
): Promise<Redeem[]> {
    try {
        const res = await pool.query(
            `SELECT
                req.redeem_id, req.amount_polka_btc, req.block_number, req.block_ts, cl.reimbursed, req.vault_id, req.btc_address, cl.cancelled, ex.executed
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
            ORDER BY ${format.ident(sortBy)} ${
                sortAsc ? "ASC" : "DESC"
            }, redeem_id ASC
            LIMIT $1 OFFSET $2`,
            [perPage, page * perPage]
        );
        return res.rows.map((row) => ({
            id: row.redeem_id,
            amountPolkaBTC: row.amount_polka_btc,
            creation: row.block_number,
            timestamp: row.block_ts,
            btcAddress: btcAddressToString(row.btc_address, network),
            vaultDotAddress: row.vault_id,
            btcTxId: "",
            confirmations: 0,
            completed: row.executed ? true : false,
            cancelled: row.cancelled ? true : false,
            reimbursed: row.reimbursed? true : false,
            isExpired: false,
        }));
    } catch (e) {
        console.error(e);
        throw e;
    }
}
