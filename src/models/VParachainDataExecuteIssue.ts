import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
    expression: `
        SELECT (v_parachain_data.event_data ->> 0) AS issue_id,
        (v_parachain_data.event_data ->> 1) AS requester_id,
        (v_parachain_data.event_data ->> 2) AS amount_btc,
        (v_parachain_data.event_data ->> 3) AS vault_id,
        v_parachain_data.block_number,
        v_parachain_data.block_ts,
        v_parachain_data.section,
        v_parachain_data.method,
        v_parachain_data.event_data
        FROM v_parachain_data
        WHERE ((v_parachain_data.section = 'issue'::text) AND (v_parachain_data.method = 'ExecuteIssue'::text));
    `,
    name: "v_parachain_data_execute_issue",
})
export class VParachainDataExecuteIssue {

    @ViewColumn()
    block_number: number;

    @ViewColumn()
    block_ts: string;

    @ViewColumn()
    section: string;

    @ViewColumn()
    method: string;

    @ViewColumn()
    event_data: string;

    @ViewColumn()
    issue_id: string;

    @ViewColumn()
    requester_id: string;

    @ViewColumn()
    amount_btc: string;

    @ViewColumn()
    vault_id: string;

}
