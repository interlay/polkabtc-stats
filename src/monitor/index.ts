import { range } from "lodash";
import PromisePool from "@supercharge/promise-pool";
import { EventRecord } from "@polkadot/types/interfaces/system";
import {
    SignedBlock,
    Moment,
    BlockNumber,
} from "@polkadot/types/interfaces/runtime";
import { PolkaBTCAPI } from "@interlay/polkabtc";

import pool from "../common/pool";
import { getPolkaBtc } from "../common/polkaBtc";
import logFn from "../common/logger";
import { btcAddressToString, BtcNetworkName, hexStringFixedPointToBig } from "../common/util";
import {BTC_NETWORK} from "../common/constants";

export const logger = logFn({ name: "monitor" });

function decodeField(fieldType: string, fieldValue: string) {
    const network = BTC_NETWORK.startsWith("http") ? "regtest" : BTC_NETWORK;
    switch (fieldType) {
        case "BtcAddress":
            return btcAddressToString(fieldValue, network as BtcNetworkName);
        case "FixedPoint":
        case "UnsignedFixedPoint":
        case "SignedFixedPoint":
            return hexStringFixedPointToBig(fieldValue).toFixed();
        default:
            return fieldValue;
    }
}

function generateEvents(
    events: EventRecord[],
    block: SignedBlock,
    timestamp: Moment
) {
    const data = [];
    for (const { event } of events) {
        if (event.section === "system") {
            continue;
        }

        let eventData = JSON.parse(event.data.toString()) as any[];
        // decode each event field
        for (let idx = 0; idx < eventData.length; idx++) {
            eventData[idx] = decodeField(
                event.typeDef[idx].type,
                eventData[idx]
            );
        }

        const msg = {
            blockNumber: block.block.header.number.toString(),
            blockHash: block.block.header.hash.toHex(),
            eventHash: event.hash.toHex(),
            timestamp: new Date(timestamp.toNumber()),
            section: event.section,
            method: event.method,
            data: eventData,
        };
        data.push(msg);
    }
    return data;
}

async function insertBlockData(polkaBTC: PolkaBTCAPI, blockNr: BlockNumber) {
    const dbclient = await pool.connect();
    const hash = await polkaBTC.api.rpc.chain.getBlockHash(blockNr);
    const [block, timestamp, events] = await Promise.all([
        polkaBTC.api.rpc.chain.getBlock(hash),
        polkaBTC.api.query.timestamp.now.at(hash),
        polkaBTC.api.query.system.events.at(hash),
    ]);
    logger.info({ blockNr, hash }, `Processing block ${blockNr} ${hash}`);

    return Promise.all(
        generateEvents(events.toArray(), block, timestamp).map((ev) =>
            dbclient.query(
                "INSERT INTO parachain_events (data, block_number, block_ts) VALUES ($1, $2, $3)",
                [
                    JSON.stringify(ev),
                    ev.blockNumber,
                    ev.timestamp,
                ]
            )
        )
    )
        .catch((ex) => logger.error(ex))
        .finally(() => dbclient.release());
}

/**
 * Retrieve the last stored block number from the database
 * @param pgclient DB client
 */
async function lastProcessedBlock() {
    const dbclient = await pool.connect();
    try {
        const result = await dbclient.query(
            "SELECT MAX(block_number) FROM parachain_events"
        );
        return result.rows[0][1] || 0;
    } finally {
        dbclient.release();
    }
}

export default async function start() {
    // await conn.synchronize(true);

    const polkaBTC = await getPolkaBtc();

    const lastDbBlock = await lastProcessedBlock();
    const lastChainBlock = (
        await polkaBTC.api.rpc.chain.getHeader()
    ).number.toNumber();

    logger.info(
        `Running backfill from block ${lastDbBlock} to ${lastChainBlock}`
    );

    await PromisePool.withConcurrency(10)
        .for(range(lastDbBlock, lastChainBlock))
        .process(async (blockNr) => {
            return await insertBlockData(
                polkaBTC,
                blockNr as unknown as BlockNumber
            );
        })
        .then(() => logger.info("Finished backfill"));

    logger.info("Subscribing to new blocks");
    polkaBTC.api.rpc.chain.subscribeFinalizedHeads(async (header) => {
        const blockNr = header.number.unwrap();
        try {
            insertBlockData(polkaBTC, blockNr);
        } catch (error) {
            logger.error(error);
        }
    });
}
