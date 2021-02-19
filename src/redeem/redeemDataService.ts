import format from "pg-format";
import { Redeem } from "./redeemModel";
import { SatoshisTimeData } from "../common/commonModels";

import pool from "../common/pool";
import {
    btcAddressToString,
    BtcNetworkName,
    Filter,
    filtersToWhere,
    runPerDayQuery,
} from "../common/util";
import { getTxDetailsForRequest, RequestType } from "../common/btcTxUtils";
import {planckToDOT, satToBTC, stripHexPrefix} from "@interlay/polkabtc";

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

export type RedeemColumns =
    | "redeem_id"
    | "requester"
    | "amount_polka_btc"
    | "fee_polkabtc"
    | "dot_premium"
    | "block_number"
    | "block_ts"
    | "reimbursed"
    | "vault_id"
    | "btc_address"
    | "cancelled"
    | "executed";

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
            ${filtersToWhere(filters)}
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
                    creation: row.block_number,
                    timestamp: row.block_ts,
                    btcAddress: userBtcAddress,
                    vaultDotAddress: row.vault_id,
                    btcTxId: txid,
                    confirmations,
                    btcBlockHeight: blockHeight,
                    completed: row.executed ? true : false,
                    cancelled: row.cancelled ? true : false,
                    reimbursed: row.reimbursed ? true : false,
                    isExpired: false,
                };
            })
        );
    } catch (e) {
        console.error("[REDEEM] getPagedRedeems: uncaught error");
        console.error(e);
        throw e;
    }
}
