import format from "pg-format";
import { Redeem } from "./redeemModel";
import { SatoshisTimeData } from "../common/commonModels";

import pool from "../common/pool";
import { btcAddressToString, runPerDayQuery } from "../common/util";

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
                coalesce(sum(amount_polka_btc::integer), 0) as sum
            FROM
                "v_parachain_redeem_request"
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
                        coalesce(SUM(amount_polka_btc::INTEGER), 0) AS value
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
    sortAsc = false
): Promise<Redeem[]> {
    try {
        const res = await pool.query(
            `SELECT
                redeem_id, amount_polka_btc, block_number, vault_id, btc_address, cancelled, executed
            FROM
                "v_parachain_redeem_request"
                LEFT OUTER JOIN
                    (SELECT
                        redeem_id, true AS cancelled
                    FROM "v_parachain_redeem_cancel")
                AS cs USING (redeem_id)
                LEFT OUTER JOIN
                    (SELECT
                        redeem_id, true AS executed
                    FROM "v_parachain_redeem_execute")
                AS es USING (redeem_id)
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
            btcAddress: btcAddressToString(row.btc_address),
            vaultDotAddress: row.vault_id,
            btcTxId: "",
            confirmations: 0,
            completed: row.executed ? true : false,
            cancelled: row.cancelled ? true : false,
            reimbursed: false,
            isExpired: false,
        }));
    } catch (e) {
        console.error(e);
        throw e;
    }
}
