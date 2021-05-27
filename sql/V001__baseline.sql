CREATE TABLE public.parachain_events (
    id serial PRIMARY KEY,
    data jsonb NOT NULL,
    block_number integer NOT NULL,
    block_ts timestamp without time zone NOT NULL
);
/* ALTER TABLE public.parachain_events OWNER TO polkabtc_monitor; */

CREATE TABLE public.request_tx_cache (
    id character varying NOT NULL,
    request_type integer NOT NULL,
    txid character varying(64) NOT NULL,
    block_height integer NOT NULL,
    confirmations integer NOT NULL
);
/* ALTER TABLE public.request_tx_cache OWNER TO polkabtc_monitor; */

CREATE TABLE public.typeorm_metadata (
    type character varying NOT NULL,
    database character varying,
    schema character varying,
    "table" character varying,
    name character varying,
    value text
);
/* ALTER TABLE public.typeorm_metadata OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_data; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_data AS
 SELECT parachain_events.block_number,
    parachain_events.block_ts,
    (parachain_events.data ->> 'section'::text) AS section,
    (parachain_events.data ->> 'method'::text) AS method,
    (parachain_events.data -> 'data'::text) AS event_data
   FROM public.parachain_events;


/* ALTER TABLE public.v_parachain_data OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_data_cancel_issue; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_data_cancel_issue AS
 SELECT (v_parachain_data.event_data ->> 0) AS issue_id,
    (v_parachain_data.event_data ->> 1) AS account_id,
    (v_parachain_data.event_data ->> 2) AS griefing_collateral,
    v_parachain_data.block_number,
    v_parachain_data.block_ts,
    v_parachain_data.section,
    v_parachain_data.method,
    v_parachain_data.event_data
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'issue'::text) AND (v_parachain_data.method = 'CancelIssue'::text));


/* ALTER TABLE public.v_parachain_data_cancel_issue OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_data_request_issue; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_data_request_issue AS
 SELECT (v_parachain_data.event_data ->> 0) AS issue_id,
    (v_parachain_data.event_data ->> 1) AS requester,
    (v_parachain_data.event_data ->> 2) AS amount_btc,
    (v_parachain_data.event_data ->> 3) AS fee_polkabtc,
    (v_parachain_data.event_data ->> 4) AS griefing_collateral,
    (v_parachain_data.event_data ->> 5) AS vault_id,
    (v_parachain_data.event_data ->> 6) AS btc_address,
    (v_parachain_data.event_data ->> 7) AS vault_wallet_pubkey,
    v_parachain_data.block_number,
    v_parachain_data.block_ts,
    v_parachain_data.section,
    v_parachain_data.method,
    v_parachain_data.event_data
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'issue'::text) AND (v_parachain_data.method = 'RequestIssue'::text));


/* ALTER TABLE public.v_parachain_data_request_issue OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_canceled_issues; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_canceled_issues AS
 SELECT e.issue_id,
    (r.amount_btc)::integer AS amount,
    e.block_number,
    e.block_ts
   FROM (public.v_parachain_data_request_issue r
     JOIN public.v_parachain_data_cancel_issue e ON ((r.issue_id = e.issue_id)));


/* ALTER TABLE public.v_parachain_canceled_issues OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_collateral_lock; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_collateral_lock AS
 SELECT (v_parachain_data.event_data ->> 0) AS account_id,
    ((v_parachain_data.event_data ->> 1))::numeric AS balance,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'collateral'::text) AND (v_parachain_data.method = 'LockCollateral'::text));


/* ALTER TABLE public.v_parachain_collateral_lock OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_collateral_release; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_collateral_release AS
 SELECT (v_parachain_data.event_data ->> 0) AS account_id,
    ((v_parachain_data.event_data ->> 1))::numeric AS balance,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'collateral'::text) AND (v_parachain_data.method = 'ReleaseCollateral'::text));


/* ALTER TABLE public.v_parachain_collateral_release OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_collateral_slash; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_collateral_slash AS
 SELECT (v_parachain_data.event_data ->> 0) AS sender_account_id,
    (v_parachain_data.event_data ->> 1) AS receiver_account_id,
    ((v_parachain_data.event_data ->> 2))::numeric AS balance,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'collateral'::text) AND (v_parachain_data.method = 'SlashCollateral'::text));


/* ALTER TABLE public.v_parachain_collateral_slash OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_data_execute_issue; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_data_execute_issue AS
 SELECT (v_parachain_data.event_data ->> 0) AS issue_id,
    (v_parachain_data.event_data ->> 1) AS requester_id,
    (v_parachain_data.event_data ->> 2) AS amount_btc,
    (v_parachain_data.event_data ->> 3) AS vault_id,
    v_parachain_data.block_number,
    v_parachain_data.block_ts,
    v_parachain_data.section,
    v_parachain_data.method,
    v_parachain_data.event_data
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'issue'::text) AND (v_parachain_data.method = 'ExecuteIssue'::text));


/* ALTER TABLE public.v_parachain_data_execute_issue OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_executed_issues; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_executed_issues AS
 SELECT (v_parachain_data.event_data ->> 0) AS tx_id,
    v_parachain_data.block_number,
    v_parachain_data.block_ts,
    v_parachain_data.section,
    v_parachain_data.method,
    v_parachain_data.event_data
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'issue'::text) AND (v_parachain_data.method = 'ExecuteIssue'::text));


/* ALTER TABLE public.v_parachain_executed_issues OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_redeem_cancel; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_redeem_cancel AS
 SELECT (v_parachain_data.event_data ->> 0) AS redeem_id,
    (v_parachain_data.event_data ->> 1) AS requester,
    (v_parachain_data.event_data ->> 2) AS vault_id,
    (v_parachain_data.event_data ->> 3) AS slashed_dot_amount,
    (v_parachain_data.event_data ->> 4) AS reimbursed,
    v_parachain_data.block_number,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'redeem'::text) AND (v_parachain_data.method = 'CancelRedeem'::text));


/* ALTER TABLE public.v_parachain_redeem_cancel OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_redeem_execute; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_redeem_execute AS
 SELECT (v_parachain_data.event_data ->> 0) AS redeem_id,
    (v_parachain_data.event_data ->> 1) AS requester,
    (v_parachain_data.event_data ->> 2) AS amount_polka_btc,
    (v_parachain_data.event_data ->> 3) AS fee_polkabtc,
    (v_parachain_data.event_data ->> 4) AS vault_id,
    v_parachain_data.block_number,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'redeem'::text) AND (v_parachain_data.method = 'ExecuteRedeem'::text));


/* ALTER TABLE public.v_parachain_redeem_execute OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_redeem_liquidate; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_redeem_liquidate AS
 SELECT (v_parachain_data.event_data ->> 0) AS requester,
    (v_parachain_data.event_data ->> 1) AS amount_polka_btc,
    v_parachain_data.block_number,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'redeem'::text) AND (v_parachain_data.method = 'LiquidationRedeem'::text));


/* ALTER TABLE public.v_parachain_redeem_liquidate OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_redeem_request; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_redeem_request AS
 SELECT (v_parachain_data.event_data ->> 0) AS redeem_id,
    (v_parachain_data.event_data ->> 1) AS requester,
    (v_parachain_data.event_data ->> 2) AS amount_polka_btc,
    (v_parachain_data.event_data ->> 3) AS fee_polkabtc,
    (v_parachain_data.event_data ->> 4) AS dot_premium,
    (v_parachain_data.event_data ->> 5) AS vault_id,
    (v_parachain_data.event_data ->> 6) AS btc_address,
    v_parachain_data.block_number,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'redeem'::text) AND (v_parachain_data.method = 'RequestRedeem'::text));


/* ALTER TABLE public.v_parachain_redeem_request OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_refund_execute; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_refund_execute AS
 SELECT (v_parachain_data.event_data ->> 0) AS refund_id,
    (v_parachain_data.event_data ->> 1) AS issuer,
    (v_parachain_data.event_data ->> 2) AS vault,
    (v_parachain_data.event_data ->> 3) AS amount,
    v_parachain_data.block_number,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'refund'::text) AND (v_parachain_data.method = 'ExecuteRefund'::text));


/* ALTER TABLE public.v_parachain_refund_execute OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_refund_request; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_refund_request AS
 SELECT (v_parachain_data.event_data ->> 0) AS refund_id,
    (v_parachain_data.event_data ->> 1) AS issuer,
    (v_parachain_data.event_data ->> 2) AS amount,
    (v_parachain_data.event_data ->> 3) AS vault,
    (v_parachain_data.event_data ->> 4) AS btc_address,
    (v_parachain_data.event_data ->> 5) AS issue_id,
    v_parachain_data.block_number,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'refund'::text) AND (v_parachain_data.method = 'RequestRefund'::text));


/* ALTER TABLE public.v_parachain_refund_request OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_replace_accept; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_replace_accept AS
 SELECT (v_parachain_data.event_data ->> 0) AS replace_id,
    (v_parachain_data.event_data ->> 1) AS old_vault_id,
    (v_parachain_data.event_data ->> 2) AS new_vault_id,
    (v_parachain_data.event_data ->> 3) AS amount_btc,
    (v_parachain_data.event_data ->> 4) AS collateral,
    (v_parachain_data.event_data ->> 5) AS btc_address,
    v_parachain_data.block_number,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'replace'::text) AND (v_parachain_data.method = 'AcceptReplace'::text));


/* ALTER TABLE public.v_parachain_replace_accept OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_replace_auction; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_replace_auction AS
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
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'replace'::text) AND (v_parachain_data.method = 'AuctionReplace'::text));


/* ALTER TABLE public.v_parachain_replace_auction OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_replace_cancel; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_replace_cancel AS
 SELECT (v_parachain_data.event_data ->> 0) AS replace_id,
    (v_parachain_data.event_data ->> 1) AS old_vault_id,
    (v_parachain_data.event_data ->> 2) AS new_vault_id,
    (v_parachain_data.event_data ->> 3) AS griefing_collateral,
    v_parachain_data.block_number,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'replace'::text) AND (v_parachain_data.method = 'CancelReplace'::text));


/* ALTER TABLE public.v_parachain_replace_cancel OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_replace_execute; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_replace_execute AS
 SELECT (v_parachain_data.event_data ->> 0) AS replace_id,
    (v_parachain_data.event_data ->> 1) AS old_vault_id,
    (v_parachain_data.event_data ->> 2) AS new_vault_id,
    v_parachain_data.block_number,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'replace'::text) AND (v_parachain_data.method = 'ExecuteReplace'::text));


/* ALTER TABLE public.v_parachain_replace_execute OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_replace_request; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_replace_request AS
 SELECT (v_parachain_data.event_data ->> 0) AS replace_id,
    (v_parachain_data.event_data ->> 1) AS old_vault_id,
    (v_parachain_data.event_data ->> 2) AS amount_btc,
    (v_parachain_data.event_data ->> 3) AS griefing_collateral,
    v_parachain_data.block_number,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'replace'::text) AND (v_parachain_data.method = 'RequestReplace'::text));


/* ALTER TABLE public.v_parachain_replace_request OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_replace_withdraw; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_replace_withdraw AS
 SELECT (v_parachain_data.event_data ->> 0) AS replace_id,
    (v_parachain_data.event_data ->> 1) AS old_vault_id,
    v_parachain_data.block_number,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'replace'::text) AND (v_parachain_data.method = 'WithdrawReplace'::text));


/* ALTER TABLE public.v_parachain_replace_withdraw OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_stakedrelayer_deregister; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_stakedrelayer_deregister AS
 SELECT (v_parachain_data.event_data ->> 0) AS relayer_id,
    v_parachain_data.block_number,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'stakedRelayers'::text) AND (v_parachain_data.method = 'DeregisterStakedRelayer'::text));


/* ALTER TABLE public.v_parachain_stakedrelayer_deregister OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_stakedrelayer_register; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_stakedrelayer_register AS
 SELECT (v_parachain_data.event_data ->> 0) AS relayer_id,
    (v_parachain_data.event_data ->> 1) AS maturity,
    (v_parachain_data.event_data ->> 2) AS stake,
    v_parachain_data.block_number,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'stakedRelayers'::text) AND (v_parachain_data.method = 'RegisterStakedRelayer'::text));


/* ALTER TABLE public.v_parachain_stakedrelayer_register OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_stakedrelayer_sla_update; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_stakedrelayer_sla_update AS
 SELECT (v_parachain_data.event_data ->> 0) AS relayer_id,
    (v_parachain_data.event_data ->> 1) AS new_sla,
    (v_parachain_data.event_data ->> 2) AS delta,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'sla'::text) AND (v_parachain_data.method = 'UpdateRelayerSLA'::text));


/* ALTER TABLE public.v_parachain_stakedrelayer_sla_update OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_stakedrelayer_slash; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_stakedrelayer_slash AS
 SELECT (v_parachain_data.event_data ->> 0) AS relayer_id,
    v_parachain_data.block_number,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'stakedRelayers'::text) AND (v_parachain_data.method = 'SlashStakedRelayer'::text));


/* ALTER TABLE public.v_parachain_stakedrelayer_slash OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_stakedrelayer_store; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_stakedrelayer_store AS
 SELECT v_parachain_data.block_number,
    (v_parachain_data.event_data ->> 0) AS bitcoin_height,
    (v_parachain_data.event_data ->> 1) AS bitcoin_hash,
    (v_parachain_data.event_data ->> 2) AS relayer_id
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'btcRelay'::text) AND (v_parachain_data.method = 'Initialized'::text))
UNION
 SELECT v_parachain_data.block_number,
    (v_parachain_data.event_data ->> 0) AS bitcoin_height,
    (v_parachain_data.event_data ->> 1) AS bitcoin_hash,
    (v_parachain_data.event_data ->> 2) AS relayer_id
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'btcRelay'::text) AND (v_parachain_data.method = 'StoreMainChainHeader'::text))
UNION
 SELECT v_parachain_data.block_number,
    (v_parachain_data.event_data ->> 0) AS bitcoin_height,
    (v_parachain_data.event_data ->> 1) AS bitcoin_hash,
    (v_parachain_data.event_data ->> 3) AS relayer_id
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'btcRelay'::text) AND (v_parachain_data.method = 'StoreForkHeader'::text));


/* ALTER TABLE public.v_parachain_stakedrelayer_store OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_status_execute; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_status_execute AS
 SELECT (v_parachain_data.event_data ->> 0) AS update_id,
    (v_parachain_data.event_data ->> 1) AS new_status,
    (v_parachain_data.event_data ->> 2) AS add_error,
    (v_parachain_data.event_data ->> 3) AS remove_error,
    (v_parachain_data.event_data ->> 4) AS btc_block_hash,
    v_parachain_data.block_number,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'stakedRelayers'::text) AND (v_parachain_data.method = 'ExecuteStatusUpdate'::text));


/* ALTER TABLE public.v_parachain_status_execute OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_status_force; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_status_force AS
 SELECT (v_parachain_data.event_data ->> 0) AS new_status,
    (v_parachain_data.event_data ->> 1) AS add_error,
    (v_parachain_data.event_data ->> 2) AS remove_error,
    v_parachain_data.block_number,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'stakedRelayers'::text) AND (v_parachain_data.method = 'ForceStatusUpdate'::text));


/* ALTER TABLE public.v_parachain_status_force OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_status_reject; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_status_reject AS
 SELECT (v_parachain_data.event_data ->> 0) AS update_id,
    (v_parachain_data.event_data ->> 1) AS new_status,
    (v_parachain_data.event_data ->> 2) AS add_error,
    (v_parachain_data.event_data ->> 3) AS remove_error,
    v_parachain_data.block_number,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'stakedRelayers'::text) AND (v_parachain_data.method = 'RejectStatusUpdate'::text));


/* ALTER TABLE public.v_parachain_status_reject OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_status_suggest; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_status_suggest AS
 SELECT (v_parachain_data.event_data ->> 0) AS update_id,
    (v_parachain_data.event_data ->> 1) AS relayer,
    (v_parachain_data.event_data ->> 2) AS new_status,
    (v_parachain_data.event_data ->> 3) AS add_error,
    (v_parachain_data.event_data ->> 4) AS remove_error,
    (v_parachain_data.event_data ->> 5) AS btc_block_hash,
    v_parachain_data.block_number,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'stakedRelayers'::text) AND (v_parachain_data.method = 'StatusUpdateSuggested'::text));


/* ALTER TABLE public.v_parachain_status_suggest OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_status_vote; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_status_vote AS
 SELECT (v_parachain_data.event_data ->> 0) AS update_id,
    (v_parachain_data.event_data ->> 1) AS relayer,
    (v_parachain_data.event_data ->> 2) AS approve,
    v_parachain_data.block_number,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'stakedRelayers'::text) AND (v_parachain_data.method = 'VoteOnStatusUpdate'::text));


/* ALTER TABLE public.v_parachain_status_vote OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_vault_collateral; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_vault_collateral AS
 SELECT (v_parachain_data.event_data ->> 0) AS vault_id,
    (v_parachain_data.event_data ->> 2) AS total_collateral,
    v_parachain_data.method,
    v_parachain_data.block_number,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'vaultRegistry'::text) AND ((v_parachain_data.method = 'WithdrawCollateral'::text) OR (v_parachain_data.method = 'LockAdditionalCollateral'::text)));


/* ALTER TABLE public.v_parachain_vault_collateral OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_vault_issue_redeem; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_vault_issue_redeem AS
 SELECT (v_parachain_data.event_data ->> 0) AS vault_id,
    ((v_parachain_data.event_data ->> 1))::integer AS btc_balance,
    v_parachain_data.method
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'vaultRegistry'::text) AND ((v_parachain_data.method = 'RedeemTokens'::text) OR (v_parachain_data.method = 'IssueTokens'::text)));


/* ALTER TABLE public.v_parachain_vault_issue_redeem OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_vault_liquidation; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_vault_liquidation AS
 SELECT (v_parachain_data.event_data ->> 0) AS vault_id,
    (v_parachain_data.event_data ->> 1) AS issued_btc,
    (v_parachain_data.event_data ->> 2) AS to_be_issued_btc,
    (v_parachain_data.event_data ->> 3) AS to_be_redeemed_btc,
    (v_parachain_data.event_data ->> 4) AS to_be_replaced_btc,
    (v_parachain_data.event_data ->> 5) AS collateral_dot,
    (v_parachain_data.event_data ->> 6) AS status,
    v_parachain_data.block_number,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'vaultRegistry'::text) AND (v_parachain_data.method = 'LiquidateVault'::text));


/* ALTER TABLE public.v_parachain_vault_liquidation OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_vault_registration; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_vault_registration AS
 SELECT (v_parachain_data.event_data ->> 0) AS vault_id,
    (v_parachain_data.event_data ->> 1) AS collateral,
    v_parachain_data.block_ts,
    v_parachain_data.block_number
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'vaultRegistry'::text) AND (v_parachain_data.method = 'RegisterVault'::text));


/* ALTER TABLE public.v_parachain_vault_registration OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_vault_sla_update; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_vault_sla_update AS
 SELECT (v_parachain_data.event_data ->> 0) AS vault_id,
    (v_parachain_data.event_data ->> 1) AS new_sla,
    (v_parachain_data.event_data ->> 2) AS delta,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'sla'::text) AND (v_parachain_data.method = 'UpdateVaultSLA'::text));


/* ALTER TABLE public.v_parachain_vault_sla_update OWNER TO polkabtc_monitor; */

--
-- Name: v_parachain_vault_theft; Type: VIEW; Schema: public; Owner: polkabtc_monitor
--

CREATE VIEW public.v_parachain_vault_theft AS
 SELECT (v_parachain_data.event_data ->> 0) AS vault_id,
    (v_parachain_data.event_data ->> 1) AS theft_tx,
    v_parachain_data.block_number,
    v_parachain_data.block_ts
   FROM public.v_parachain_data
  WHERE ((v_parachain_data.section = 'vaultRegistry'::text) AND (v_parachain_data.method = 'VaultTheft'::text));


/* ALTER TABLE public.v_parachain_vault_theft OWNER TO polkabtc_monitor; */

ALTER TABLE ONLY public.parachain_events ALTER COLUMN id SET DEFAULT nextval('public.parachain_events_id_seq'::regclass);

ALTER TABLE ONLY public.request_tx_cache
    ADD CONSTRAINT "PK_17c1d0e620eb2a0fc1447f45fe3" PRIMARY KEY (id, request_type);
/* ALTER TABLE ONLY public.parachain_events */
/*     ADD CONSTRAINT "PK_50c9172ad6a748317ee80e67fe2" PRIMARY KEY (id); */

CREATE INDEX idx_parachain_event_field_blocknr ON public.parachain_events USING btree (((data ->> 'section'::text)), ((data ->> 'method'::text)), block_number DESC);
CREATE INDEX idx_parachain_event_ts ON public.parachain_events USING btree (((data ->> 'section'::text)), ((data ->> 'method'::text)), block_ts DESC);
CREATE INDEX idx_parachain_event_ts_date ON public.parachain_events USING btree (((data ->> 'section'::text)), ((data ->> 'method'::text)), ((block_ts)::date) DESC);



/* GRANT USAGE ON SCHEMA data TO polkabtc_standalone_reader; */
/* GRANT USAGE ON SCHEMA data TO polkabtc_standalone_writer; */
/* GRANT USAGE ON SCHEMA data TO polkabtc_standalone_data_reader; */
/* GRANT USAGE ON SCHEMA data TO polkabtc_standalone_data_writer; */

/* GRANT USAGE ON SCHEMA pooler TO pooler; */
/* REVOKE ALL ON FUNCTION pooler.user_lookup(i_username text, OUT uname text, OUT phash text) FROM PUBLIC; */
/* GRANT ALL ON FUNCTION pooler.user_lookup(i_username text, OUT uname text, OUT phash text) TO pooler; */
