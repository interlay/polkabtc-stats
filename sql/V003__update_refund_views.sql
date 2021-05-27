DROP VIEW public.v_parachain_refund_request;

CREATE VIEW public.v_parachain_refund_request AS
 SELECT (v_parachain_data.event_data ->> 0) AS refund_id,
    (v_parachain_data.event_data ->> 1) AS issuer,
    (v_parachain_data.event_data ->> 2) AS amount,
    (v_parachain_data.event_data ->> 3) AS vault,
    (v_parachain_data.event_data ->> 4) AS btc_address,
    (v_parachain_data.event_data ->> 5) AS issue_id,
    (v_parachain_data.event_data ->> 6) AS fee,
    v_parachain_data.block_number,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'refund'::text) AND (v_parachain_data.method = 'RequestRefund'::text));


DROP VIEW public.v_parachain_vault_liquidation;

CREATE VIEW public.v_parachain_vault_liquidation AS
 SELECT (v_parachain_data.event_data ->> 0) AS vault_id,
    (v_parachain_data.event_data ->> 1) AS issued_btc,
    (v_parachain_data.event_data ->> 2) AS to_be_issued_btc,
    (v_parachain_data.event_data ->> 3) AS to_be_redeemed_btc,
    (v_parachain_data.event_data ->> 4) AS to_be_replaced_btc,
    (v_parachain_data.event_data ->> 5) AS collateral_dot,
    (v_parachain_data.event_data ->> 6) AS status,
    (v_parachain_data.event_data ->> 7) AS griefing_collateral,
    v_parachain_data.block_number,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'vaultRegistry'::text) AND (v_parachain_data.method = 'LiquidateVault'::text));
