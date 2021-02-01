import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
    expression: `
        SELECT (v_parachain_data.event_data ->> 0) AS vault_id,
        ((v_parachain_data.event_data ->> 1))::integer AS btc_balance,
        v_parachain_data.method
        FROM v_parachain_data
        WHERE ((v_parachain_data.section = 'vaultRegistry'::text) AND ((v_parachain_data.method = 'RedeemTokens'::text) OR (v_parachain_data.method = 'IssueTokens'::text)));
    `
})
export class VParachainVaultIssueRedeem {

    @ViewColumn()
    vault_id: string;

    @ViewColumn()
    btc_balance: number;

    @ViewColumn()
    method: string;

}