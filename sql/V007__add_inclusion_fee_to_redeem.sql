--
-- Name: v_parachain_redeem_request; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE OR REPLACE VIEW public.v_parachain_redeem_request AS
 SELECT (v_parachain_data.event_data ->> 0) AS redeem_id,
    (v_parachain_data.event_data ->> 1) AS requester,
    (v_parachain_data.event_data ->> 2) AS amount_polka_btc,
    (v_parachain_data.event_data ->> 3) AS fee_polkabtc,
    (v_parachain_data.event_data ->> 4) AS dot_premium,
    (v_parachain_data.event_data ->> 5) AS vault_id,
    (v_parachain_data.event_data ->> 6) AS btc_address,
    (v_parachain_data.event_data ->> 7) AS transfer_fee_btc,
    v_parachain_data.block_number,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'redeem'::text) AND (v_parachain_data.method = 'RequestRedeem'::text));


/* ALTER TABLE public.v_parachain_redeem_request OWNER TO polkabtc_monitor; */
