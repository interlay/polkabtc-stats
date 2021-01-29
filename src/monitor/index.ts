import promClient from 'prom-client';
import { range } from 'lodash';
import PromisePool from '@supercharge/promise-pool';
import { Client } from 'pg';
import pino from 'pino';
import { EventRecord } from "@polkadot/types/interfaces/system";
import { SignedBlock, Moment, BlockNumber } from "@polkadot/types/interfaces/runtime";
import { createPolkabtcAPI, PolkaBTCAPI } from "@interlay/polkabtc";

const logger = pino()

process.on('uncaughtException', pino.final(logger, (err, finalLogger) => {
    finalLogger.error(err, 'uncaughtException')
    process.exit(1)
}))

process.on('unhandledRejection', pino.final(logger, (err, finalLogger) => {
    finalLogger.error(err, 'unhandledRejection')
    process.exit(1)
}))

const pgclient = new Client({ ssl: false })
pgclient.connect().catch(e => {
    console.log(e);
    process.exit(1)
})

const eventTypeCounter = new promClient.Counter({
    name: 'event_type',
    help: 'event_type',
    labelNames: ['section', 'method'],
});

function decodeEvent(event: any) {
    eventTypeCounter.inc({ section: event.section, method: event.method });
    return event.data.toJSON()
}

function generateEvents(events: EventRecord[], block: SignedBlock, timestamp: Moment) {
    const data = []
    for (const { event } of events) {
        if (event.section === 'system') {
            continue;
        }

        const msg = {
            blockNumber: block.block.header.number.toJSON(),
            blockHash: block.block.header.hash.toHex(),
            timestamp: timestamp.toJSON(),
            section: event.section,
            method: event.method,
            data: decodeEvent(event)
        }
        data.push(msg)
    }
    return data
}

const INSERT_QUERY = 'INSERT INTO parachain_events (block_number, block_ts, data) VALUES ($1, to_timestamp($2), $3)'

async function insertBlockData(polkaBTC: PolkaBTCAPI, blockNr: BlockNumber) {
    const hash = await polkaBTC.api.rpc.chain.getBlockHash(blockNr)
    const block = await polkaBTC.api.rpc.chain.getBlock(hash)
    const timestamp = await polkaBTC.api.query.timestamp.now.at(hash)

    const events = await polkaBTC.api.query.system.events.at(hash)

    logger.info(`Processing block ${blockNr} ${hash}`)

    const promises = []
    for (let ev of generateEvents(events.toArray(), block, timestamp)) {
        promises.push(
            pgclient.query(INSERT_QUERY, [ev.blockNumber, ev.timestamp / 1000, ev])
        )
    }
    return Promise.all(promises)
}

/**
 * Retrieve the last stored block number from the database
 * @param pgclient DB client
 */
async function lastProcessedBlock(pgclient: Client) {
    const rows = await pgclient.query('SELECT max(block_number) AS last_block FROM parachain_events')
    return rows.rows[0].last_block || 0
}

export default async function start(url: string) {
    const polkaBTC = await createPolkabtcAPI(url, "testnet");

    const lastDbBlock = await lastProcessedBlock(pgclient)
    const lastChainBlock = (await polkaBTC.api.rpc.chain.getHeader()).number.toNumber()

    logger.info(`Running backfill from block ${lastDbBlock} to ${lastChainBlock}`)

    await PromisePool
        .withConcurrency(10)
        .for(range(lastDbBlock, lastChainBlock))
        .process(async blockNr => {
            return await insertBlockData(polkaBTC, blockNr as unknown as BlockNumber)
        })
        .then(() => logger.info('Finished backfill'))

    logger.info('Subscribing to new blocks')
    polkaBTC.api.rpc.chain.subscribeNewHeads(async (header) => {
        const blockNr = header.number.unwrap()
        try {
            insertBlockData(polkaBTC, blockNr)
        } catch (error) {
            console.error(error)
        }
    })
}
