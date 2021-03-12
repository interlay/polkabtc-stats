import { ViewEntity, ViewColumn } from "typeorm";

        // [replace_id, old_vault_id, new_vault_id, amount, collateral, btc_address]
@ViewEntity({
    expression: `
    SELECT (v_parachain_data.event_data ->> 0) AS replace_id,
        (v_parachain_data.event_data ->> 1) AS old_vault_id,
        (v_parachain_data.event_data ->> 2) AS new_vault_id,
        (v_parachain_data.event_data ->> 3) AS amount_btc,
        (v_parachain_data.event_data ->> 4) AS collateral,
        (v_parachain_data.event_data ->> 5) AS btc_address,
        v_parachain_data.block_number,
        v_parachain_data.block_ts
    FROM v_parachain_data
    WHERE ((v_parachain_data.section = 'replace'::text) AND (v_parachain_data.method = 'AcceptReplace'::text));`,
    name: "v_parachain_replace_accept",
})

export class VParachainReplaceAccept {
    @ViewColumn()
    replace_id: string;

    @ViewColumn()
    old_vault_id: string;

    @ViewColumn()
    new_vault_id: string;

    @ViewColumn()
    amount_btc: string;

    @ViewColumn()
    collateral: string;

    @ViewColumn()
    btc_address: string;
}
