import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
    expression: `
        SELECT (v_parachain_data.event_data ->> 0) AS tx_id,
        v_parachain_data.block_number,
        v_parachain_data.block_ts,
        v_parachain_data.section,
        v_parachain_data.method,
        v_parachain_data.event_data
        FROM v_parachain_data
        WHERE ((v_parachain_data.section = 'issue'::text) AND (v_parachain_data.method = 'ExecuteIssue'::text));
    `,
    name: "v_parachain_executed_issues",
})
export class VParachainExecutedIssues {

    @ViewColumn()
    tx_id: string;

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

}
