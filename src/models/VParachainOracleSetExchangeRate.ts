import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
    expression: `
    SELECT (v_parachain_data.event_data ->> 0) AS oracle_id,
        (v_parachain_data.event_data ->> 1) AS exchange_rate,
        v_parachain_data.block_number,
        v_parachain_data.block_ts
    FROM v_parachain_data
    WHERE ((v_parachain_data.section = 'exchangeRateOracle'::text) AND (v_parachain_data.method = 'SetExchangeRate'::text));`,
    name: "v_parachain_oracle_set_exchange_rate",
})

export class VParachainOracleSetExchangeRate {
    @ViewColumn()
    oracle_id: string;

    @ViewColumn()
    exchange_rate: string;
}
