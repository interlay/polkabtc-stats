import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
    expression: `
        SELECT v_parachain_data.event_data ->> 0 AS relayer_id,
            coalesce((v_parachain_data.event_data ->> 3)::numeric,0) AS new_sla,
            coalesce((v_parachain_data.event_data ->> 4)::numeric,0) AS delta,
            v_parachain_data.block_ts
        FROM v_parachain_data
        WHERE v_parachain_data.section = 'sla'::text AND v_parachain_data.method = 'UpdateRelayerSLA'::text;
    `,
    name: "v_parachain_stakedrelayer_sla_update",
})
export class VParachainStakedrelayerSlaUpdate {

    @ViewColumn()
    relayer_id: string;

    @ViewColumn()
    new_sla: string;

    @ViewColumn()
    delta: string;

    @ViewColumn()
    block_ts: string;

}
