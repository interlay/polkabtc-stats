import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
    expression: `
        SELECT (v_parachain_data.event_data ->> 0) AS account_id,
        ((v_parachain_data.event_data ->> 1))::numeric AS balance,
        v_parachain_data.block_ts
        FROM v_parachain_data
        WHERE ((v_parachain_data.section = 'collateral'::text) AND (v_parachain_data.method = 'LockCollateral'::text));
    `,
    name: "v_parachain_collateral_lock",
})
export class VParachainCollateralLock {

    @ViewColumn()
    account_id: string;

    @ViewColumn()
    balance: number;

    @ViewColumn()
    block_ts: string;

}
