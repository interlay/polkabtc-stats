import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
    expression: `
        SELECT v_parachain_data.event_data ->> 0 AS vault_id,
            coalesce((v_parachain_data.event_data ->> 3)::numeric,0) AS new_sla,
            coalesce((v_parachain_data.event_data ->> 4)::numeric,0) AS delta,
            v_parachain_data.block_ts
        FROM v_parachain_data
        WHERE v_parachain_data.section = 'sla'::text AND v_parachain_data.method = 'UpdateVaultSLA'::text;
    `,
    name: "v_parachain_vault_sla_update",
})
export class VParachainVaultSlaUpdate {

    @ViewColumn()
    vault_id: string;

    @ViewColumn()
    new_sla: number;

    @ViewColumn()
    delta: number;

    @ViewColumn()
    block_ts: string;

}
