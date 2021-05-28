/* Exact same data, except lock collateral event renamed from LockAdditionalCollateral to DepositCollateral */

CREATE OR REPLACE VIEW public.v_parachain_vault_collateral AS
 SELECT (v_parachain_data.event_data ->> 0) AS vault_id,
    (v_parachain_data.event_data ->> 2) AS total_collateral,
    v_parachain_data.method,
    v_parachain_data.block_number,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'vaultRegistry'::text) AND ((v_parachain_data.method = 'WithdrawCollateral'::text) OR (v_parachain_data.method = 'DepositCollateral'::text)));
