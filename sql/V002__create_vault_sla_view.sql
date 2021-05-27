CREATE VIEW v_parachain_vault_sla_update_v2 AS
    SELECT v_parachain_data.event_data ->> 0 AS vault_id,
        coalesce((v_parachain_data.event_data ->> 3)::numeric,0) AS new_sla,
        coalesce((v_parachain_data.event_data ->> 4)::numeric,0) AS delta,
        v_parachain_data.block_ts
   FROM v_parachain_data
   WHERE v_parachain_data.section = 'sla'::text AND v_parachain_data.method = 'UpdateVaultSLA'::text;

CREATE VIEW v_parachain_stakedrelayer_sla_update_v2 AS
    SELECT v_parachain_data.event_data ->> 0 AS vault_id,
    coalesce((v_parachain_data.event_data ->> 3)::numeric,0) AS new_sla,
    coalesce((v_parachain_data.event_data ->> 4)::numeric,0) AS delta,
    v_parachain_data.block_ts
   FROM v_parachain_data
  WHERE v_parachain_data.section = 'sla'::text AND v_parachain_data.method = 'UpdateRelayerSLA'::text;