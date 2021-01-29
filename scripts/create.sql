CREATE ROLE polkabtc_beta_user;
ALTER ROLE polkabtc_beta_user WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS;
ALTER ROLE polkabtc_beta_user WITH PASSWORD 'password';
ALTER ROLE polkabtc_beta_user SET search_path TO '$user', 'data';

CREATE DATABASE polkabtc_beta;

\connect polkabtc_beta

CREATE SCHEMA data;
GRANT USAGE ON SCHEMA data TO polkabtc_beta_user;

CREATE TABLE data.parachain_events (
    id integer NOT NULL,
    data jsonb NOT NULL,
    block_number integer NOT NULL,
    block_ts timestamp without time zone NOT NULL
);

ALTER TABLE data.parachain_events OWNER TO polkabtc_beta_user;

CREATE SEQUENCE data.parachain_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE data.parachain_events_id_seq OWNER TO polkabtc_beta_user;

CREATE VIEW data.v_parachain_data AS
 SELECT parachain_events.block_number,
    parachain_events.block_ts,
    (parachain_events.data ->> 'section'::text) AS section,
    (parachain_events.data ->> 'method'::text) AS method,
    (parachain_events.data -> 'data'::text) AS event_data
   FROM data.parachain_events;

CREATE VIEW data.v_parachain_data_cancel_issue AS
 SELECT (v_parachain_data.event_data ->> 0) AS issue_id,
    (v_parachain_data.event_data ->> 1) AS account_id,
    v_parachain_data.block_number,
    v_parachain_data.block_ts,
    v_parachain_data.section,
    v_parachain_data.method,
    v_parachain_data.event_data
   FROM data.v_parachain_data
  WHERE ((v_parachain_data.section = 'issue'::text) AND (v_parachain_data.method = 'CancelIssue'::text));

CREATE VIEW data.v_parachain_data_request_issue AS
 SELECT (v_parachain_data.event_data ->> 0) AS issue_id,
    (v_parachain_data.event_data ->> 1) AS requester,
    (v_parachain_data.event_data ->> 2) AS amount_btc,
    (v_parachain_data.event_data ->> 3) AS vault_id,
    (v_parachain_data.event_data ->> 4) AS btc_address,
    (v_parachain_data.event_data ->> 5) AS vault_wallet_pubkey,
    v_parachain_data.block_number,
    v_parachain_data.block_ts,
    v_parachain_data.section,
    v_parachain_data.method,
    v_parachain_data.event_data
   FROM data.v_parachain_data
  WHERE ((v_parachain_data.section = 'issue'::text) AND (v_parachain_data.method = 'RequestIssue'::text));

CREATE VIEW data.v_parachain_canceled_issues AS
 SELECT e.issue_id,
    (r.amount_btc)::integer AS amount,
    e.block_number,
    e.block_ts
   FROM (data.v_parachain_data_request_issue r
     JOIN data.v_parachain_data_cancel_issue e ON ((r.issue_id = e.issue_id)));

CREATE VIEW data.v_parachain_collateral_lock AS
 SELECT (v_parachain_data.event_data ->> 0) AS account_id,
    ((v_parachain_data.event_data ->> 1))::numeric AS balance,
    v_parachain_data.block_ts
   FROM data.v_parachain_data
  WHERE ((v_parachain_data.section = 'collateral'::text) AND (v_parachain_data.method = 'LockCollateral'::text));

CREATE VIEW data.v_parachain_collateral_release AS
 SELECT (v_parachain_data.event_data ->> 0) AS account_id,
    ((v_parachain_data.event_data ->> 1))::numeric AS balance,
    v_parachain_data.block_ts
   FROM data.v_parachain_data
  WHERE ((v_parachain_data.section = 'collateral'::text) AND (v_parachain_data.method = 'ReleaseCollateral'::text));

CREATE VIEW data.v_parachain_collateral_slash AS
 SELECT (v_parachain_data.event_data ->> 0) AS sender_account_id,
    (v_parachain_data.event_data ->> 1) AS receiver_account_id,
    ((v_parachain_data.event_data ->> 2))::numeric AS balance,
    v_parachain_data.block_ts
   FROM data.v_parachain_data
  WHERE ((v_parachain_data.section = 'collateral'::text) AND (v_parachain_data.method = 'SlashCollateral'::text));

CREATE VIEW data.v_parachain_data_execute_issue AS
 SELECT (v_parachain_data.event_data ->> 0) AS issue_id,
    (v_parachain_data.event_data ->> 1) AS requester_id,
    (v_parachain_data.event_data ->> 2) AS vault_id,
    v_parachain_data.block_number,
    v_parachain_data.block_ts,
    v_parachain_data.section,
    v_parachain_data.method,
    v_parachain_data.event_data
   FROM data.v_parachain_data
  WHERE ((v_parachain_data.section = 'issue'::text) AND (v_parachain_data.method = 'ExecuteIssue'::text));

CREATE VIEW data.v_parachain_executed_issues AS
 SELECT (v_parachain_data.event_data ->> 0) AS tx_id,
    v_parachain_data.block_number,
    v_parachain_data.block_ts,
    v_parachain_data.section,
    v_parachain_data.method,
    v_parachain_data.event_data
   FROM data.v_parachain_data
  WHERE ((v_parachain_data.section = 'issue'::text) AND (v_parachain_data.method = 'ExecuteIssue'::text));

CREATE VIEW data.v_parachain_vault_issue_redeem AS
 SELECT (v_parachain_data.event_data ->> 0) AS vault_id,
    ((v_parachain_data.event_data ->> 1))::integer AS btc_balance,
    v_parachain_data.method
   FROM data.v_parachain_data
  WHERE ((v_parachain_data.section = 'vaultRegistry'::text) AND ((v_parachain_data.method = 'RedeemTokens'::text) OR (v_parachain_data.method = 'IssueTokens'::text)));

CREATE VIEW data.v_parachain_vault_registration AS
 SELECT (v_parachain_data.event_data ->> 0) AS vault_id,
    (v_parachain_data.event_data ->> 1) AS collateral,
    v_parachain_data.block_ts
   FROM data.v_parachain_data
  WHERE ((v_parachain_data.section = 'vaultRegistry'::text) AND (v_parachain_data.method = 'RegisterVault'::text));

CREATE VIEW data.v_parachain_vault_summary AS
 SELECT ( SELECT sum(v_parachain_vault_issue_redeem.btc_balance) AS s
           FROM data.v_parachain_vault_issue_redeem
          WHERE ((v_parachain_vault_issue_redeem.vault_id = reg.vault_id) AND (v_parachain_vault_issue_redeem.method = 'IssueTokens'::text))) AS issued_sum,
    ( SELECT sum(v_parachain_vault_issue_redeem.btc_balance) AS s
           FROM data.v_parachain_vault_issue_redeem
          WHERE ((v_parachain_vault_issue_redeem.vault_id = reg.vault_id) AND (v_parachain_vault_issue_redeem.method = 'RedeemTokens'::text))) AS redeemed_sum,
    10 AS total_locked_btc,
    2 AS total_locked_dot,
    reg.vault_id
   FROM data.v_parachain_vault_registration reg;

ALTER TABLE ONLY data.parachain_events ALTER COLUMN id SET DEFAULT nextval('data.parachain_events_id_seq'::regclass);

CREATE INDEX idx_parachain_data_section_method ON data.parachain_events USING btree (((data ->> 'section'::text)), ((data ->> 'method'::text)), block_ts DESC);

CREATE UNIQUE INDEX idx_parachain_event ON data.parachain_events USING btree (block_number, block_ts, data);

GRANT SELECT ON TABLE data.parachain_events TO polkabtc_beta_user;
GRANT SELECT ON TABLE data.v_parachain_data TO polkabtc_beta_user;
GRANT SELECT ON TABLE data.v_parachain_data_cancel_issue TO polkabtc_beta_user;
GRANT SELECT ON TABLE data.v_parachain_data_request_issue TO polkabtc_beta_user;
GRANT SELECT ON TABLE data.v_parachain_canceled_issues TO polkabtc_beta_user;
GRANT SELECT ON TABLE data.v_parachain_collateral_lock TO polkabtc_beta_user;
GRANT SELECT ON TABLE data.v_parachain_collateral_release TO polkabtc_beta_user;
GRANT SELECT ON TABLE data.v_parachain_collateral_slash TO polkabtc_beta_user;
GRANT SELECT ON TABLE data.v_parachain_data_execute_issue TO polkabtc_beta_user;
GRANT SELECT ON TABLE data.v_parachain_executed_issues TO polkabtc_beta_user;
GRANT SELECT ON TABLE data.v_parachain_vault_issue_redeem TO polkabtc_beta_user;
GRANT SELECT ON TABLE data.v_parachain_vault_registration TO polkabtc_beta_user;
GRANT SELECT ON TABLE data.v_parachain_vault_summary TO polkabtc_beta_user;

