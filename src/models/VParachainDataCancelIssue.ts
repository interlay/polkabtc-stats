import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
    expression: `
        SELECT (v_parachain_data.event_data ->> 0) AS issue_id,
            (v_parachain_data.event_data ->> 1) AS account_id,
            (v_parachain_data.event_data ->> 2) AS griefing_collateral,
            v_parachain_data.block_number,
            v_parachain_data.block_ts,
            v_parachain_data.section,
            v_parachain_data.method,
            v_parachain_data.event_data
        FROM v_parachain_data
        WHERE ((v_parachain_data.section = 'issue'::text) AND (v_parachain_data.method = 'CancelIssue'::text));
    `,
    name: "v_parachain_data_cancel_issue",
})
export class VParachainDataCancelIssue {

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
    account_id: string;

    @ViewColumn()
    griefing_collateral: string;
}
