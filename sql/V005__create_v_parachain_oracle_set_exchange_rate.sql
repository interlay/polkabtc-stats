CREATE VIEW v_parachain_oracle_set_exchange_rate AS
SELECT (v_parachain_data.event_data ->> 0) AS oracle_id,
        (v_parachain_data.event_data ->> 1) AS exchange_rate,
        v_parachain_data.block_number,
        v_parachain_data.block_ts
    FROM v_parachain_data
    WHERE ((v_parachain_data.section = 'exchangeRateOracle'::text) AND (v_parachain_data.method = 'SetExchangeRate'::text));
/* GRANT SELECT ON v_parachain_oracle_set_exchange_rate TO polkabtc_monitor; */
