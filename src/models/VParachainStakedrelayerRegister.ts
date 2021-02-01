import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
    expression: `
    SELECT (v_parachain_data.event_data ->> 0) AS relayer_id,
        v_parachain_data.block_number,
        v_parachain_data.block_ts
    FROM v_parachain_data
    WHERE ((v_parachain_data.section = 'stakedRelayers'::text) AND (v_parachain_data.method = 'RegisterStakedRelayer'::text));`,
    name: "v_parachain_stakedrelayer_register",
})
export class VParachainStakedrelayerRegister {
    @ViewColumn()
    relayer_id: string;

    @ViewColumn()
    block_number: number;

    @ViewColumn()
    block_ts: string;
}
