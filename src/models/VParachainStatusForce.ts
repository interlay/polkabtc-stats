import { ViewColumn, ViewEntity } from "typeorm";

@ViewEntity({
    expression: `
        SELECT
            event_data ->> 0 AS new_status,
            event_data ->> 1 AS add_error,
            event_data ->> 2 AS remove_error,
            block_number,
            block_ts
        FROM "v_parachain_data"
        WHERE "section"='stakedRelayers' and "method"='ForceStatusUpdate'
    `,
    name: "v_parachain_status_force",
})
export class VParachainStatusForce {
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
