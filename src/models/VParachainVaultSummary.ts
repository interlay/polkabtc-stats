import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
    expression: `
        SELECT ( SELECT sum(v_parachain_vault_issue_redeem.btc_balance) AS s
        FROM v_parachain_vault_issue_redeem
        WHERE ((v_parachain_vault_issue_redeem.vault_id = reg.vault_id) AND (v_parachain_vault_issue_redeem.method = 'IssueTokens'::text))) AS issued_sum,
        ( SELECT sum(v_parachain_vault_issue_redeem.btc_balance) AS s
        FROM v_parachain_vault_issue_redeem
        WHERE ((v_parachain_vault_issue_redeem.vault_id = reg.vault_id) AND (v_parachain_vault_issue_redeem.method = 'RedeemTokens'::text))) AS redeemed_sum,
        10 AS total_locked_btc,
        2 AS total_locked_dot,
        reg.vault_id
        FROM v_parachain_vault_registration reg;
`
})
export class VParachainVaultSummary {

    @ViewColumn()
    issued_sum: number;

    @ViewColumn()
    redeemed_sum: number;

    @ViewColumn()
    total_locked_btc: number;

    @ViewColumn()
    total_locked_dot: number;

    @ViewColumn()
    vault_id: string;

}