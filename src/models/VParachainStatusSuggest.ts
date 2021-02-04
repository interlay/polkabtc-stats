import { ViewColumn, ViewEntity } from "typeorm";

@ViewEntity({
    expression: `
        SELECT
            event_data ->> 0 AS update_id,
            event_data ->> 1 AS relayer,
            event_data ->> 2 AS new_status,
            event_data ->> 3 AS add_error,
            event_data ->> 4 AS remove_error,
            event_data ->> 5 AS btc_block_hash,
            block_number,
            block_ts
        FROM "v_parachain_data"
        WHERE "section"='stakedRelayers' and "method"='StatusUpdateSuggested'
    `,
    name: "v_parachain_status_suggest",
})
export class VParachainStatusSuggest {
    @ViewColumn()
    update_id: string;

    @ViewColumn()
    relayer: string;

    @ViewColumn()
    new_status: string;

    @ViewColumn()
    add_error: string;

    @ViewColumn()
    remove_error: string;

    @ViewColumn()
    btc_block_hash: string;

    @ViewColumn()
    block_number: string;

    @ViewColumn()
    block_ts: string;
}
