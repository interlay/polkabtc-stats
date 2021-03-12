import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
    expression: `
    SELECT (v_parachain_data.event_data ->> 0) AS requester,
        (v_parachain_data.event_data ->> 1) AS amount_polka_btc,
        v_parachain_data.block_number,
        v_parachain_data.block_ts
    FROM v_parachain_data
    WHERE ((v_parachain_data.section = 'redeem'::text) AND (v_parachain_data.method = 'LiquidationRedeem'::text));`,
    name: "v_parachain_redeem_liquidate",
})

export class VParachainRedeemLiquidate {
    @ViewColumn()
    requester: string;

    @ViewColumn()
    amount_polka_btc: string;
}
