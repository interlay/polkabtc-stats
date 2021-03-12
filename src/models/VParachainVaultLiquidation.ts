import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
    expression: `
    SELECT (v_parachain_data.event_data ->> 0) AS vault_id,
        (v_parachain_data.event_data ->> 1) AS issued_btc,
        (v_parachain_data.event_data ->> 2) AS to_be_issued_btc,
        (v_parachain_data.event_data ->> 3) AS to_be_redeemed_btc,
        (v_parachain_data.event_data ->> 4) AS to_be_replaced_btc,
        (v_parachain_data.event_data ->> 5) AS collateral_dot,
        (v_parachain_data.event_data ->> 6) AS status,
        v_parachain_data.block_number,
        v_parachain_data.block_ts
    FROM v_parachain_data
    WHERE ((v_parachain_data.section = 'vaultRegistry'::text) AND (v_parachain_data.method = 'LiquidateVault'::text));`,
    name: "v_parachain_vault_liquidation",
})

export class VParachainVaultLiquidation {
    @ViewColumn()
    vault_id: string;

    @ViewColumn()
    issued_btc: string;

    @ViewColumn()
    to_be_issued_btc: string;

    @ViewColumn()
    to_be_redeemed_btc: string;

    @ViewColumn()
    to_be_replaced_btc: string;

    @ViewColumn()
    collateral_dot: string;

    @ViewColumn()
    status: string;
}
