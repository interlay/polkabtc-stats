import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
    expression: `
        SELECT (v_parachain_data.event_data ->> 0) AS vault_id,
        ((v_parachain_data.event_data ->> 2)) AS total_collateral,
        v_parachain_data.method,
        v_parachain_data.block_number
        FROM v_parachain_data
        WHERE ((v_parachain_data.section = 'vaultRegistry'::text) AND ((v_parachain_data.method = 'WithdrawCollateral'::text) OR (v_parachain_data.method = 'LockAdditionalCollateral'::text)));
    `,
    name: "v_parachain_vault_collateral",
})
export class VParachainVaultCollateral {

    @ViewColumn()
    vault_id: string;

    @ViewColumn()
    total_collateral: number;

    @ViewColumn()
    method: string;

    @ViewColumn()
    block_number: number;

}
