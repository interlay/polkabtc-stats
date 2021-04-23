import {assert} from "chai";
import {RelayerColumns} from "../../src/common/columnTypes";
import {
    getAllRelayers,
    getRecentDailyRelayers, getRelayersWithTrackRecord
} from "../../src/relayers/relayersDataService";
import {RelayerCountTimeData, RelayerData} from "../../src/relayers/relayersModel";
import {getUTCMidnight} from "../util";

describe("Relayers", () => {
    it("should return the relayer counts for the last three days", async () => {
        const recentDailyCounts = await getRecentDailyRelayers(3);
        const count = 94;
        const nextMidnight = getUTCMidnight(new Date()).getTime();
        const expected = Array.from({length: 4}, (_, idx) => ({date: nextMidnight - (idx * 86400 * 1000), count} as RelayerCountTimeData)).reverse();
        return assert.deepEqual(recentDailyCounts, expected);
    });

    it("should return all relayers above an SLA threshold", async () => {
        const relayers = await getRelayersWithTrackRecord(90, 1209600 * 1000);
        const expected = [
            {
                id: '5DNzULM1UJXDM7NUgDL4i8Hrhe9e3vZkB3ByM1eEXMGAs4Bv',
                duration: 1781640000,
                threshold: 90
            },
            {
                id: '5EHvPFaei9Ca32WFaCrHeuMLPmMzjMLExGSRLCYrbNCubuc1',
                duration: 1319136000,
                threshold: 90
            },
            {
                id: '5EhYmqeCq3aSjSbg27dyVuL7w2zi7p37szaWLLcV7dJ85tx9',
                duration: 1749036000,
                threshold: 90
            },
            {
                id: '5FUgMUK3dPZ1kYXHVfYkT8wiAay6nhKeuuNFDwPgAWjdScTX',
                duration: 1742232000,
                threshold: 90
            },
            {
                id: '5FYfd4ad2eXVQTDH91stzT78T2mn1i2CtPPGKfgRahKpfCcd',
                duration: 1335390000,
                threshold: 90
            },
            {
                id: '5G93b8L8urnJCBYDyEcu2LQa6JvZ61cHMNQsyJ7RdmGKkqcy',
                duration: 1581084000,
                threshold: 90
            },
            {
                id: '5GEXRnnv8Qz9rEwMs4TfvHme48HQvVTEDHJECCvKPzFB4pFZ',
                duration: 1868382000,
                threshold: 90
            },
            {
                id: '5HmDjMNozF4cUidXQp3xRRCcmmSpr6hsrt8PbNX4CC3YbaYj',
                duration: 1366428000,
                threshold: 90
            }
        ];
        return assert.deepEqual(relayers, expected)
    });

    it("should return the first 5 relayers", async () => {
        const relayers = await getAllRelayers(0, 5, "block_number" as RelayerColumns, false, [], 1617451200000); //sla limit to avoid unparsed hex SLAs
        const expected = [
            {
                id: '5C4oqR3Y1bU7ZRLpsnF2FDLQHY4KCtZC9z64MFsWAd3mgnN4',
                stake: '0.8',
                bonded: true,
                slashed: false,
                lifetime_sla: null,
                block_count: '0'
            },
            {
                id: '5C5WeqVx1HnC56YKKrhCxDYCbVL77gFy5rbr65VjC97ogPkX',
                stake: '0.8',
                bonded: true,
                slashed: false,
                lifetime_sla: null,
                block_count: '0'
            },
            {
                id: '5C8QtNSRU8BgZbnx9Zfu5Do4MopJH1ocPmdogqU1UcXUMorN',
                stake: '0.8',
                bonded: true,
                slashed: false,
                lifetime_sla: null,
                block_count: '0'
            },
            {
                id: '5C8YH53Q2EL7ZS9kato5wbBqJduXUiZoGxZwQtuS6gUK65eS',
                stake: '0.8',
                bonded: true,
                slashed: false,
                lifetime_sla: null,
                block_count: '0'
            },
            {
                id: '5CaM5Uoarf4umeakqyoBMu9DdFzeZTx9asSa4XrxdnZRv6BL',
                stake: '0.8',
                bonded: true,
                slashed: false,
                lifetime_sla: null,
                block_count: '0'
            },
        ];
        assert.deepEqual(relayers, expected as unknown as RelayerData[]);
        return false;
        //TODO: fix relayer SLA in database
    });
});
