import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
    expression: `
    SELECT
        (v_parachain_data.event_data ->> 0) AS redeem_id,
        (v_parachain_data.event_data ->> 1) AS requester,
        (v_parachain_data.event_data ->> 2) AS amount_polka_btc,
        (v_parachain_data.event_data ->> 3) AS vault_id,
        (v_parachain_data.event_data ->> 4) AS btc_address,
        v_parachain_data.block_number,
        v_parachain_data.block_ts
    FROM v_parachain_data
    WHERE ((v_parachain_data.section = 'redeem'::text) AND (v_parachain_data.method = 'RequestRedeem'::text));`,
    name: "v_parachain_redeem_request",
})
export class VParachainRedeemRequest {
    @ViewColumn()
    redeem_id: string;

    @ViewColumn()
    requester: string;

    @ViewColumn()
    amount_polka_btc: string;

    @ViewColumn()
    vault_id: string;

    @ViewColumn()
    btc_address: string;

    @ViewColumn()
    block_number: number;

    @ViewColumn()
    block_ts: string;
}
