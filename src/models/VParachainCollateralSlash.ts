import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
    expression: `
        SELECT (v_parachain_data.event_data ->> 0) AS sender_account_id,
        (v_parachain_data.event_data ->> 1) AS receiver_account_id,
        ((v_parachain_data.event_data ->> 2))::numeric AS balance,
        v_parachain_data.block_ts
        FROM v_parachain_data
        WHERE ((v_parachain_data.section = 'collateral'::text) AND (v_parachain_data.method = 'SlashCollateral'::text));
    `
})
export class VParachainCollateralSlash {

    @ViewColumn()
    sender_account_id: string;

    @ViewColumn()
    receiver_account_id: string;

    @ViewColumn()
    balance: number;

    @ViewColumn()
    block_ts: string;

}