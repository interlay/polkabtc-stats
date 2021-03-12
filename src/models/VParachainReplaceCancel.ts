import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
    expression: `
    SELECT (v_parachain_data.event_data ->> 0) AS replace_id,
        (v_parachain_data.event_data ->> 1) AS old_vault_id,
        (v_parachain_data.event_data ->> 2) AS new_vault_id,
        (v_parachain_data.event_data ->> 3) AS griefing_collateral,
        v_parachain_data.block_number,
        v_parachain_data.block_ts
    FROM v_parachain_data
    WHERE ((v_parachain_data.section = 'replace'::text) AND (v_parachain_data.method = 'CancelReplace'::text));`,
    name: "v_parachain_replace_cancel",
})

export class VParachainReplaceCancel {
    @ViewColumn()
    replace_id: string;

    @ViewColumn()
    old_vault_id: string;

    @ViewColumn()
    new_vault_id: string;

    @ViewColumn()
    griefing_collateral: string;
}
