import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
    expression: `
    SELECT (v_parachain_data.event_data ->> 0) AS old_vault_id,
        (v_parachain_data.event_data ->> 1) AS withdrawn_polkabtc,
        (v_parachain_data.event_data ->> 2) AS withdrawn_griefing_collateral,
        v_parachain_data.block_number,
        v_parachain_data.block_ts
    FROM v_parachain_data
    WHERE ((v_parachain_data.section = 'replace'::text) AND (v_parachain_data.method = 'WithdrawReplace'::text));`,
    name: "v_parachain_replace_withdraw",
})

export class VParachainReplaceWithdraw {
    @ViewColumn()
    old_vault_id: string;

    @ViewColumn()
    withdrawn_polkabtc: string;

    @ViewColumn()
    withdrawn_griefing_collateral: string;
}
