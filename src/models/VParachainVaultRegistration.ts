import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
    expression: `
        SELECT (v_parachain_data.event_data ->> 0) AS vault_id,
        (v_parachain_data.event_data ->> 1) AS collateral,
        v_parachain_data.block_ts
        FROM v_parachain_data
        WHERE ((v_parachain_data.section = 'vaultRegistry'::text) AND (v_parachain_data.method = 'RegisterVault'::text));
    `,
    name: "v_parachain_vault_registration",
})
export class VParachainVaultRegistration {

    @ViewColumn()
    vault_id: string;

    @ViewColumn()
    collateral: string;

    @ViewColumn()
    block_ts: string;

}
