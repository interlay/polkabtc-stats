import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
    expression: `
    SELECT
    (v_parachain_data.event_data ->> 0) AS refund_id,
    (v_parachain_data.event_data ->> 1) AS issuer,
    (v_parachain_data.event_data ->> 2) AS amount,
    (v_parachain_data.event_data ->> 3) AS vault,
    (v_parachain_data.event_data ->> 4) AS btc_address,
    (v_parachain_data.event_data ->> 5) AS issue_id,
    v_parachain_data.block_number,
    v_parachain_data.block_ts
FROM v_parachain_data
        WHERE ((v_parachain_data.section = 'refund'::text) AND (v_parachain_data.method = 'RequestRefund'::text));
    `,
    name: "v_parachain_refund_request",
})
export class VParachainRefundRequest {
    @ViewColumn()
    refund_id: string;

    @ViewColumn()
    issuer: number;

    @ViewColumn()
    amount: string;

    @ViewColumn()
    vault: string;

    @ViewColumn()
    btc_address: string;

    @ViewColumn()
    issue_id: string;
}
