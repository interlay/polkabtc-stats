import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
    expression: `
    SELECT
    (v_parachain_data.event_data ->> 0) AS refund_id,
    (v_parachain_data.event_data ->> 1) AS issuer,
    (v_parachain_data.event_data ->> 2) AS vault,
    (v_parachain_data.event_data ->> 3) AS amount,
    v_parachain_data.block_number,
    v_parachain_data.block_ts
FROM v_parachain_data
        WHERE ((v_parachain_data.section = 'refund'::text) AND (v_parachain_data.method = 'ExecuteRefund'::text));
    `,
    name: "v_parachain_refund_execute",
})
export class VParachainRefundExecute {
    @ViewColumn()
    refund_id: string;

    @ViewColumn()
    issuer: number;

    @ViewColumn()
    vault: string;

    @ViewColumn()
    amount: string;
}
