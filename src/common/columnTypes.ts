export type IssueColumns =
    | "issue_id"
    | "amount_btc"
    | "requester"
    | "fee_polkabtc"
    | "griefing_collateral"
    | "vault_wallet_pubkey"
    | "block_number"
    | "block_ts"
    | "vault_id"
    | "btc_address"
    | "cancelled"
    | "executed";

export type RedeemColumns =
    | "redeem_id"
    | "requester"
    | "amount_polka_btc"
    | "fee_polkabtc"
    | "dot_premium"
    | "block_number"
    | "block_ts"
    | "reimbursed"
    | "vault_id"
    | "btc_address"
    | "cancelled"
    | "executed";

export type StatusUpdateColumns =
    | "update_id"
    | "block_ts"
    | "block_number"
    | "new_status"
    | "add_error"
    | "remove_error"
    | "btc_block_hash"
    | "yeas"
    | "nays"
    | "executed"
    | "rejected"
    | "forced";

export type BlockColumns = "height" | "hash" | "relay_ts";

export type VaultColumns =
    | "vault_id"
    | "block_number"
    | "collateral"
    | "locked_btc"
    | "pending_btc"
    | "committed_theft"
    | "liquidated"
    | "banned_until";

export type VaultChallengeColumns =
    | "vault_id"
    | "block_number"
    | "collateral"
    | "request_issue_count"
    | "execute_issue_count"
    | "request_redeem_count"
    | "execute_redeem_count"
    | "cancel_redeem_count"
    | "lifetime_sla_change";

export type RelayerChallengeColumns =
    | "relayer_id"
    | "block_number"
    | "stake"
    | "deregistered"
    | "slashed"
    | "bonded"
    | "lifetime_sla_change";

export type Colmuns =
    | IssueColumns
    | RedeemColumns
    | StatusUpdateColumns
    | BlockColumns
    | VaultColumns
    | VaultChallengeColumns
    | RelayerChallengeColumns;
