import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
    expression: `
    SELECT (v_parachain_data.event_data ->> 0) AS vault_id,
        (v_parachain_data.event_data ->> 1) AS theft_tx,
        v_parachain_data.block_number,
        v_parachain_data.block_ts
    FROM v_parachain_data
    WHERE ((v_parachain_data.section = 'vaultRegistry'::text) AND (v_parachain_data.method = 'VaultTheft'::text));`,
    name: "v_parachain_vault_theft",
})
export class VParachainVaultTheft {
    @ViewColumn()
    vault_id: string;

    @ViewColumn()
    theft_tx: string;
}
