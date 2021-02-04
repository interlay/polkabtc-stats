import { ViewColumn, ViewEntity } from "typeorm";

@ViewEntity({
    expression: `
        SELECT
            event_data ->> 0 AS update_id,
            event_data ->> 1 AS new_status,
            event_data ->> 2 AS add_error,
            event_data ->> 3 AS remove_error,
            block_number,
            block_ts
        FROM "v_parachain_data"
        WHERE "section"='stakedRelayers' and "method"='RejectStatusUpdate'
    `,
    name: "v_parachain_status_reject",
})
export class VParachainStatusReject {
    @ViewColumn()
    update_id: string;

    @ViewColumn()
    new_status: string;

    @ViewColumn()
    add_error: string;

    @ViewColumn()
    remove_error: string;

    @ViewColumn()
    block_number: string;

    @ViewColumn()
    block_ts: string;
}
