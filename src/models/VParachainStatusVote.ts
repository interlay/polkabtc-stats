import { ViewColumn, ViewEntity } from "typeorm";

@ViewEntity({
    expression: `
        SELECT
            event_data ->> 0 AS update_id,
            event_data ->> 1 AS relayer,
            event_data ->> 2 AS approve,
            block_number,
            block_ts
        FROM "v_parachain_data"
        WHERE "section"='stakedRelayers' and "method"='VoteOnStatusUpdate'
    `,
    name: "v_parachain_status_vote",
})
export class VParachainStatusVote {
    @ViewColumn()
    update_id: string;

    @ViewColumn()
    relayer: string;

    @ViewColumn()
    approve: boolean;
}
