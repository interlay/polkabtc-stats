import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
    expression: `
    SELECT (v_parachain_data.event_data ->> 0) AS old_vault_id,
        (v_parachain_data.event_data ->> 1) AS amount_btc,
        (v_parachain_data.event_data ->> 2) AS griefing_collateral,
        v_parachain_data.block_number,
        v_parachain_data.block_ts
    FROM v_parachain_data
    WHERE ((v_parachain_data.section = 'replace'::text) AND (v_parachain_data.method = 'RequestReplace'::text));`,
    name: "v_parachain_replace_request",
})

export class VParachainReplaceRequest {
    @ViewColumn()
    old_vault_id: string;

    @ViewColumn()
    amount_btc: string;

    @ViewColumn()
    griefing_collateral: string;
}
