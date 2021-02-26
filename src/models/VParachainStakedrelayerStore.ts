import { ViewEntity, ViewColumn } from "typeorm";

// Initialized(u32, H256Le, AccountId),
// StoreMainChainHeader(u32, H256Le, AccountId),
// StoreForkHeader(u32, u32, H256Le, AccountId),

@ViewEntity({
    expression: `
        SELECT
            v_parachain_data.block_number,
            "event_data" ->> 0 AS bitcoin_height,
            "event_data" ->> 1 AS bitcoin_hash,
            "event_data" ->> 2 AS relayer_id
        FROM "v_parachain_data"
        WHERE "section"='btcRelay'::text AND "method"='Initialized'::text
        UNION
        SELECT
            v_parachain_data.block_number,
            "event_data" ->> 0 AS bitcoin_height,
            "event_data" ->> 1 AS bitcoin_hash,
            "event_data" ->> 2 AS relayer_id
        FROM "v_parachain_data"
        WHERE "section"='btcRelay'::text AND "method"='StoreMainChainHeader'::text
          UNION
        SELECT
            v_parachain_data.block_number,
            "event_data" ->> 0 AS bitcoin_height,
            "event_data" ->> 1 AS bitcoin_hash,
            "event_data" ->> 3 AS relayer_id
        FROM "v_parachain_data"
        WHERE "section"='btcRelay'::text AND "method"='StoreForkHeader'::text
    `,
    name: "v_parachain_stakedrelayer_store",
})
export class VParachainStakedrelayerStore {
    @ViewColumn()
    block_number: string;

    @ViewColumn()
    bitcoin_height: number;

    @ViewColumn()
    bitcoin_hash: string;

    @ViewColumn()
    relayer_id: string;
}
