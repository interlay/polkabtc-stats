import format from "pg-format";
import { Block } from "./blockModel";
import pool from "../common/pool";

export async function getPagedBlocks(
    page: number,
    perPage: number,
    sortBy = "height",
    sortAsc = false
): Promise<Block[]> {
    console.log(sortBy);
    console.log(sortAsc ? "ASC" : "DESC");
    const res = await pool.query(
        `SELECT
            "event_data" ->> 0 AS height, "event_data" ->> 1 AS "hash", "block_ts" AS "relay_ts"
        FROM "v_parachain_data"
        WHERE "section"='btcRelay'::text AND "method"='StoreMainChainHeader'::text
        ORDER BY ${format.ident(sortBy)} ${sortAsc ? "ASC" : "DESC"}
        LIMIT $1 OFFSET $2`,
        [perPage, page * perPage]
    );
    return res.rows.map((row) => ({
        height: row.height,
        hash: row.hash,
        relay_ts: row.relay_ts,
    }));
}
