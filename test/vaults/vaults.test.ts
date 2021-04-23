import {assert} from "chai";
import {VaultColumns} from "../../src/common/columnTypes";
import {
    getAllVaults,
    getRecentDailyCollateral,
    getRecentDailyVaults, getVaultsWithTrackRecord
} from "../../src/vaults/vaultDataService";
import {CollateralTimeData, VaultCountTimeData, VaultData} from "../../src/vaults/vaultModels";
import {getUTCMidnight} from "../util";

describe.only("Vaults", () => {
    it("should return the vault counts for the last three days", async () => {
        const recentDailyCounts = await getRecentDailyVaults(3);
        const count = "127";
        const nextMidnight = getUTCMidnight(new Date()).getTime();
        const expected = Array.from({length: 4}, (_, idx) => ({date: nextMidnight - (idx * 86400 * 1000), count} as VaultCountTimeData)).reverse();
        return assert.deepEqual(recentDailyCounts, expected);
    });

    it("should return the collateral locked for the last three days", async () => {
        const recentDailyCollateral = await getRecentDailyCollateral(3);
        const amount = "8005858892506083";
        const nextMidnight = getUTCMidnight(new Date()).getTime();
        const expected = Array.from({length: 3}, (_, idx) => ({date: nextMidnight - (idx * 86400 * 1000), amount} as CollateralTimeData)).reverse();
        return assert.deepEqual(recentDailyCollateral, expected);
    });

    it("should return all vaults above an SLA threshold", async () => {
        const relayers = await getVaultsWithTrackRecord(50, 604800 * 1000);
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

    it("should return the first 5 vaults", async () => {
        const vaults = await getAllVaults(0, 5, "block_number" as VaultColumns, false, [], 0);
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
        assert.deepEqual(vaults, expected as unknown as VaultData[]);
        return false;
        //TODO: fix vault SLA in database
    });
});
