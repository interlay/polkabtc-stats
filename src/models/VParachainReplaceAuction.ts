import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
    expression: `
    SELECT (v_parachain_data.event_data ->> 0) AS replace_id,
        (v_parachain_data.event_data ->> 1) AS old_vault_id,
        (v_parachain_data.event_data ->> 2) AS new_vault_id,
        (v_parachain_data.event_data ->> 3) AS btc_amount,
        (v_parachain_data.event_data ->> 4) AS collateral,
        (v_parachain_data.event_data ->> 5) AS reward,
        (v_parachain_data.event_data ->> 6) AS griefing_collateral,
        (v_parachain_data.event_data ->> 7) AS current_height,
        (v_parachain_data.event_data ->> 8) AS btc_address,
        v_parachain_data.block_number,
        v_parachain_data.block_ts
    FROM v_parachain_data
    WHERE ((v_parachain_data.section = 'replace'::text) AND (v_parachain_data.method = 'AuctionReplace'::text));`,
    name: "v_parachain_replace_auction",
})

export class VParachainReplaceAuction {
    @ViewColumn()
    replace_id: string;

    @ViewColumn()
    old_vault_id: string;

    @ViewColumn()
    new_vault_id: string;

    @ViewColumn()
    btc_amount: string;

    @ViewColumn()
    collateral: string;

    @ViewColumn()
    reward: string;

    @ViewColumn()
    griefing_collateral: string;

    @ViewColumn()
    current_height: string;

    @ViewColumn()
    btc_address: string;
}
