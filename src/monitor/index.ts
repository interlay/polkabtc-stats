import { range } from "lodash";
import PromisePool from "@supercharge/promise-pool";
import { EventRecord } from "@polkadot/types/interfaces/system";
import {
    SignedBlock,
    Moment,
    BlockNumber,
} from "@polkadot/types/interfaces/runtime";
import { PolkaBTCAPI } from "@interlay/polkabtc";

import { Connection, getRepository } from "typeorm";

import { ParachainEvents } from "../models/ParachainEvents";
import {getTypeORMConnection} from "../common/ormConnection";
import {getPolkaBtc} from "../common/polkaBtc";
import logFn from '../common/logger'

export const logger = logFn({ name: 'monitor' });

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

        const msg = {
            blockNumber: block.block.header.number.toString(),
            blockHash: block.block.header.hash.toHex(),
            timestamp: timestamp.toNumber(),
            section: event.section,
            method: event.method,
            data: event.data.toJSON(),
        };
        data.push(msg);
    }
    return data;
}

async function insertBlockData(
    conn: Connection,
    polkaBTC: PolkaBTCAPI,
    blockNr: BlockNumber
) {
    const hash = await polkaBTC.api.rpc.chain.getBlockHash(blockNr);
    const block = await polkaBTC.api.rpc.chain.getBlock(hash);
    const timestamp = await polkaBTC.api.query.timestamp.now.at(hash);

    const events = await polkaBTC.api.query.system.events.at(hash);

    logger.info({ blockNr, hash }, `Processing block ${blockNr} ${hash}`);

    const promises = [];
    for (let ev of generateEvents(events.toArray(), block, timestamp)) {
        let event = new ParachainEvents();
        event.data = ev;
        event.block_number = ev.blockNumber;
        event.block_ts = new Date(ev.timestamp);
        promises.push(conn.manager.save(event));
    }
    return Promise.all(promises);
}

/**
 * Retrieve the last stored block number from the database
 * @param pgclient DB client
 */
async function lastProcessedBlock() {
    const result = await getRepository("parachain_events")
        .createQueryBuilder()
        .select("MAX(block_number)", "last_block")
        .getRawOne();
    return result.last_block || 0;
}

export default async function start() {
    const conn = await getTypeORMConnection();

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
                conn,
                polkaBTC,
                (blockNr as unknown) as BlockNumber
            );
        })
        .then(() => logger.info("Finished backfill"));

    logger.info("Subscribing to new blocks");
    polkaBTC.api.rpc.chain.subscribeNewHeads(async (header) => {
        const blockNr = header.number.unwrap();
        try {
            insertBlockData(conn, polkaBTC, blockNr);
        } catch (error) {
            logger.error(error);
            await conn.close();
        }
    });
}
