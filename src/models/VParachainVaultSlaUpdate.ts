import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
    expression: `
        SELECT (v_parachain_data.event_data ->> 0) AS vault_id,
        (v_parachain_data.event_data ->> 1) AS new_sla,
        (v_parachain_data.event_data ->> 2) AS delta,
        v_parachain_data.block_ts
        FROM v_parachain_data
        WHERE ((v_parachain_data.section = 'sla'::text) AND (v_parachain_data.method = 'UpdateVaultSLA'::text));
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
