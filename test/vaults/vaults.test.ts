import {assert} from "chai";
import {VaultColumns} from "../../src/common/columnTypes";
import {
    getAllVaults,
    getRecentDailyCollateral,
    getRecentDailyVaults, getVaultsWithTrackRecord
} from "../../src/vaults/vaultDataService";
import {CollateralTimeData, VaultCountTimeData, VaultData} from "../../src/vaults/vaultModels";
import {getMidnight, getUTCMidnight} from "../util";
import BN from "bn.js";

describe("Vaults", () => {
    it("should return the vault counts for the last three days", async () => {
        const recentDailyCounts = await getRecentDailyVaults(3);
        const count = 100;
        const nextMidnight = getUTCMidnight(new Date()).getTime();
        const expected = Array.from({length: 4}, (_, idx) => ({date: nextMidnight - (idx * 86400 * 1000), count} as VaultCountTimeData)).reverse();
        return assert.deepEqual(recentDailyCounts, expected);
    });

    it("should return the collateral locked for the last three days", async () => {
        const recentDailyCollateral = await getRecentDailyCollateral(3);
        const amount = new BN(6285912090771455);
        const nextMidnight = getMidnight(new Date()).getTime() + 86400 * 1000;
        const expected = Array.from({length: 3}, (_, idx) => ({date: nextMidnight - (idx * 86400 * 1000), amount} as CollateralTimeData)).reverse();
        return assert.deepEqual(recentDailyCollateral, expected);
    });

    it("should return all vaults above an SLA threshold", async () => {
        const relayers = await getVaultsWithTrackRecord(70, 86400 * 7 * 1000);
        const expected = [
            {
                id: '5CDcDRuDVT5Go9ZPYMHoTd9CWZqKegQBmPpSkbHRgkFbh6ZW',
                duration: 2845044000,
                threshold: 70
            },
            {
                id: '5CJncqjWDkYv4P6nccZHGh8JVoEBXvharMqVpkpJedoYNu4A',
                duration: 858576000,
                threshold: 70
            },
            {
                id: '5F7Q9FqnGwJmjLtsFGymHZXPEx2dWRVE7NW4Sw2jzEhUB5WQ',
                duration: 801342000,
                threshold: 70
            },
            {
                id: '5FYfd4ad2eXVQTDH91stzT78T2mn1i2CtPPGKfgRahKpfCcd',
                duration: 3463128000,
                threshold: 70
            },
        ];
        return assert.deepEqual(relayers, expected)
    });

    it("should return the first 5 vaults", async () => {
        const vaults = await getAllVaults(0, 5, "block_number" as VaultColumns, false, [], 0);
        const expected = [
            {
                cancel_redeem_count: "7",
                collateral: "4999.2",
                execute_issue_count: "3",
                execute_redeem_count: "0",
                request_issue_count: "11",
                request_redeem_count: "20",
                id: '5HZCoEzpKyM237fRJLVwnYby1Y7USh1ycb9MxRjNY2Q8sjWn',
                lifetime_sla: '0',
            },
            {
                cancel_redeem_count: "1",
                collateral: "500.6",
                execute_issue_count: "9",
                execute_redeem_count: "0",
                request_issue_count: "14",
                request_redeem_count: "11",
                id: '5HSzFFcfCX5eN1r7zrgfuejRPxs1VLnw1BHSdmRMqFkMkF5c',
                lifetime_sla: '0',
            },
            {
                cancel_redeem_count: "4",
                collateral: "500.6",
                execute_issue_count: "3",
                execute_redeem_count: "0",
                request_issue_count: "7",
                request_redeem_count: "4",
                id: '5Hpgbxsqub993v3MgZFK572XNQ2CFNgbBTDAeB3Y8WdKKGzA',
                lifetime_sla: '0',
            },
            {
                cancel_redeem_count: "3",
                collateral: "500.6",
                execute_issue_count: "9",
                execute_redeem_count: "0",
                request_issue_count: "16",
                request_redeem_count: "7",
                id: '5HjExdNwjmMfLEAh4J2g35eopmun6SarkffeWEKZXAjKkiXv',
                lifetime_sla: '0',
            },
            {
                cancel_redeem_count: "2",
                collateral: "500.6",
                execute_issue_count: "12",
                execute_redeem_count: "1",
                request_issue_count: "22",
                request_redeem_count: "6",
                id: '5HHRtmnBc5Hgb4vrdaHFB5CVErGYLzFQ4VZ8PtokjE9AhPwg',
                lifetime_sla: '2798731246889024',
            },
        ];
        assert.deepEqual(vaults, expected as unknown as VaultData[]);
    });
});
