/* Add block_ts column */

CREATE OR REPLACE VIEW public.v_parachain_stakedrelayer_store AS
 SELECT v_parachain_data.block_number,
    (v_parachain_data.event_data ->> 0) AS bitcoin_height,
    (v_parachain_data.event_data ->> 1) AS bitcoin_hash,
    (v_parachain_data.event_data ->> 2) AS relayer_id,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'btcRelay'::text) AND (v_parachain_data.method = 'Initialized'::text))
UNION
 SELECT v_parachain_data.block_number,
    (v_parachain_data.event_data ->> 0) AS bitcoin_height,
    (v_parachain_data.event_data ->> 1) AS bitcoin_hash,
    (v_parachain_data.event_data ->> 2) AS relayer_id,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'btcRelay'::text) AND (v_parachain_data.method = 'StoreMainChainHeader'::text))
UNION
 SELECT v_parachain_data.block_number,
    (v_parachain_data.event_data ->> 0) AS bitcoin_height,
    (v_parachain_data.event_data ->> 1) AS bitcoin_hash,
    (v_parachain_data.event_data ->> 3) AS relayer_id,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'btcRelay'::text) AND (v_parachain_data.method = 'StoreForkHeader'::text));
