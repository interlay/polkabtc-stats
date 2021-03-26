import pool from "./pool";
import { TimeDataPoint } from "./commonModels";
import { payments, networks } from "bitcoinjs-lib";
import format from "pg-format";
import Big from "big.js";
import { Colmuns } from "./columnTypes";
import { decodeFixedPointType } from "@interlay/polkabtc";
import { SignedFixedPoint } from "@interlay/polkabtc/build/interfaces";
import { TypeRegistry } from "@polkadot/types";

export const msInDay = 86400 * 1000;
export const MAX_CONF =
    (process.env.MAX_BTC_CONFIRMATIONS &&
        parseInt(process.env.MAX_BTC_CONFIRMATIONS)) ||
    6;

export type BtcNetworkName = "mainnet" | "testnet" | "regtest";

export type Filter<C extends Colmuns> = {
    column: C;
    value: string;
};

export function filtersToWhere<C extends Colmuns>(filters: Filter<C>[]) {
    if (filters.length === 0) return "";
    return filters
        .reduce(
            (cond, filter) =>
                cond +
                `${format.ident(filter.column)} = ${format.literal(
                    filter.value
                )} AND `,
            "WHERE "
        )
        .slice(0, -5);
}

export function dateToMidnight(timestamp: number): number {
    const date = new Date(timestamp);
    date.setMilliseconds(0);
    date.setSeconds(0);
    date.setMinutes(0);
    date.setHours(0);
    return date.getTime();
}

export function btcAddressToString(
    addressObject: string,
    network: BtcNetworkName
): string {
    const parsedAddress = JSON.parse(addressObject);
    const hash = Buffer.from(
        Object.values<string>(parsedAddress)[0].substring(2),
        "hex"
    );
    const paymentType = Object.keys(parsedAddress)[0];
    const payment =
        paymentType === "P2WPKHv0"
            ? payments.p2wpkh
            : paymentType === "P2PKH"
                ? payments.p2pkh
                : paymentType === "P2SH"
                    ? payments.p2sh
                    : () => {
                        throw new Error("Invalid address type");
                    };
    return (
        payment({
            hash,
            network: networks[network === "mainnet" ? "bitcoin" : network],
        }).address || ""
    );
}

export function hexStringFixedPointToBig(
    fixedPoint: string
): Big {
    const typeRegistry = new TypeRegistry();
    const val = typeRegistry.createType("FixedI128", fixedPoint);
    return new Big(decodeFixedPointType(val as SignedFixedPoint));
}

export function getDurationAboveMinSla(
    minSla: number,
    slaChanges: { f1: string; f2: string }[]
) {
    let maxDuration = 0;
    let currentDuration = 0;
    let lastTs = new Date(Object.values(slaChanges[0])[1] as string).getTime();
    slaChanges.forEach((slaChange) => {
        const [newSlaEncoded, date] = Object.values(slaChange);
        const timestamp = new Date(date).getTime();
        const newSla = hexStringFixedPointToBig(newSlaEncoded);
        if (newSla.gte(minSla)) {
            currentDuration += timestamp - lastTs;
            maxDuration = Math.max(maxDuration, currentDuration);
        } else {
            currentDuration = 0;
        }
        lastTs = timestamp;
    });
    return maxDuration;
}

/**
 * Helper function to run cumulative queries for a number of consecutive days.
 * @param singleDayQueryBuilder: a function that takes an index and a timestamp string, and must return a query that returns the cumulative total for a single day.
 *  - the returned query MUST have an "idx" column, with the value of the idx parameter
 *  - the returned query MUST have a "value" column, with the datapoint of the query
 *  - the returned query MUST contain a WHERE clause limiting results to those STRICTLY BEFORE the timestamp
 **/
export async function runPerDayQuery(
    daysBack: number,
    singleDayQueryBuilder: (idx: number, timestamp: string) => string
): Promise<TimeDataPoint[]> {
    let query = "";
    const dayBoundaries: number[] = [];
    for (let i = 0; i < daysBack; i++) {
        const dayBoundary = dateToMidnight(Date.now() - (i - 1) * msInDay);
        dayBoundaries.push(dayBoundary);

        query +=
            singleDayQueryBuilder(i, new Date(dayBoundary).toISOString()) +
            `\nunion all\n`;
    }
    query = query.slice(0, -10); // last 'union all'
    const res = (await pool.query(query)).rows.sort((a, b) => a.idx - b.idx);
    return res
        .map((row, i) => ({ date: dayBoundaries[i], value: row.value }))
        .reverse();
}
