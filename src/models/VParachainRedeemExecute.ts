import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
    expression: `
    SELECT (v_parachain_data.event_data ->> 0) AS redeem_id,
        (v_parachain_data.event_data ->> 1) AS requester,
        (v_parachain_data.event_data ->> 2) AS amount_polka_btc,
        (v_parachain_data.event_data ->> 3) AS fee_polkabtc,
        (v_parachain_data.event_data ->> 4) AS vault_id,
        v_parachain_data.block_number,
        v_parachain_data.block_ts
    FROM v_parachain_data
    WHERE ((v_parachain_data.section = 'redeem'::text) AND (v_parachain_data.method = 'ExecuteRedeem'::text));`,
    name: "v_parachain_redeem_execute",
})
export class VParachainRedeemExecute {
    @ViewColumn()
    redeem_id: string;

    @ViewColumn()
    requester: string;

    @ViewColumn()
    amount_polka_btc: string;

    @ViewColumn()
    fee_polkabtc: string;

    @ViewColumn()
    vault_id: string;

    @ViewColumn()
    block_number: number;

    @ViewColumn()
    block_ts: string;
}
