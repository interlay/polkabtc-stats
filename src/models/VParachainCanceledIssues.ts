import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
    expression: `
        SELECT e.issue_id,
        (r.amount_btc)::integer AS amount,
        e.block_number,
        e.block_ts
        FROM (v_parachain_data_request_issue r
        JOIN v_parachain_data_cancel_issue e ON ((r.issue_id = e.issue_id)));
    `,
    name: "v_parachain_canceled_issues",
})
export class VParachainCanceledIssues {

    @ViewColumn()
    issue_id: string;

    @ViewColumn()
    amount: number;

    @ViewColumn()
    block_number: number;

    @ViewColumn()
    block_ts: string;

}
