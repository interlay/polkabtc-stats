import format from "pg-format";
import { BtcBlock } from "./blockModel";
import pool from "../common/pool";
import { stripHexPrefix } from "@interlay/polkabtc";
import { BlockColumns } from "../common/columnTypes";

export async function getPagedBlocks(
    page: number,
    perPage: number,
    sortBy: BlockColumns,
    sortAsc: boolean
): Promise<BtcBlock[]> {
    const res = await pool.query(`
        SELECT DISTINCT ON (hash)
            ("event_data" ->> 0)::INTEGER AS height, "event_data" ->> 1 AS "hash", "block_ts" AS "relay_ts"
        FROM "v_parachain_data"
        WHERE "section"='btcRelay'::text AND "method"='StoreMainChainHeader'::text
        ORDER BY hash, ${format.ident(sortBy)} ${sortAsc ? "ASC" : "DESC"}
        LIMIT $1 OFFSET $2
        `, [perPage, page * perPage]
    );
    return res.rows.map((row) => ({
        height: row.height.toString(),
        hash: stripHexPrefix(row.hash),
        relay_ts: row.relay_ts,
    }));
}

export async function totalRelayedBlocks(): Promise<string> {
    const res = await pool.query(`SELECT count(*) from "v_parachain_data"
        WHERE "section"='btcRelay'::text AND "method"='StoreMainChainHeader'::text`);
    return res.rows[0].count;
}
