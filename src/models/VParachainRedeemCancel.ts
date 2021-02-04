import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
    expression: `
    SELECT (v_parachain_data.event_data ->> 0) AS redeem_id,
        (v_parachain_data.event_data ->> 1) AS requester,
        v_parachain_data.block_number,
        v_parachain_data.block_ts
    FROM v_parachain_data
    WHERE ((v_parachain_data.section = 'redeem'::text) AND (v_parachain_data.method = 'CancelRedeem'::text));
    `,
    name: "v_parachain_redeem_cancel",
})
export class VParachainRedeemCancel {
    @ViewColumn()
    redeem_id: string;

    @ViewColumn()
    requester: string;

    @ViewColumn()
    block_number: number;

    @ViewColumn()
    block_ts: string;
}