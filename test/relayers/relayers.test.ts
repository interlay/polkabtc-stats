import {assert} from "chai";
import {RelayerChallengeColumns} from "../../src/common/columnTypes";
import {
    getAllRelayers,
    getRecentDailyRelayers, getRelayersWithTrackRecord
} from "../../src/relayers/relayersDataService";
import {RelayerCountTimeData, RelayerData} from "../../src/relayers/relayersModel";
import {getUTCMidnight} from "../util";

describe("Relayers", () => {
    it("should return the relayer counts for the last three days", async () => {
        const recentDailyCounts = await getRecentDailyRelayers(3);
        const count = 74;
        const nextMidnight = getUTCMidnight(new Date()).getTime();
        const expected = Array.from({length: 4}, (_, idx) => ({date: nextMidnight - (idx * 86400 * 1000), count} as RelayerCountTimeData)).reverse();
        return assert.deepEqual(recentDailyCounts, expected);
    });

    it("should return all relayers above an SLA threshold", async () => {
        const relayers = await getRelayersWithTrackRecord(70, 86400 * 7 * 1000);
        const expected = [
            {
                id: "5EZL3AtPujxbsKTXNMuKGUXoHcwVR5eryjBLbXCh4jMjoShs",
                duration: 838098332,
                threshold: 70
            },
            {
                id: "5Fy7WepFMJC3rzu48ZAcKGATgCyAwoZr65ZZYuDda8ZabWG1",
                duration: 658271878,
                threshold: 70
            },
            {
                id: "5GbsQTMojZxQKrE6ZGBikPL2xUbQDgacrv2ayMcQZhttQYYM",
                duration: 1673406000,
                threshold: 70
            },
            {
                id: "5GxiJMth1RLJBLVkZAgEg8CCgpaR8jrGuJGhxSvGkrR8BRTt",
                duration: 649062000,
                threshold: 70
            },
            {
                id: "5HHRtmnBc5Hgb4vrdaHFB5CVErGYLzFQ4VZ8PtokjE9AhPwg",
                duration: 1786458000,
                threshold: 70
            },
            {
                id: "5HYJpFhDaQVvp59GvfF1Rwk9jAsSMRs1hCKoYUDzXKfZL5T1",
                duration: 790806000,
                threshold: 70
            },
        ];
        return assert.deepEqual(relayers, expected)
    });

    it("should return the first 5 relayers", async () => {
        const relayers = await getAllRelayers(1617451200000, 0, 5, "block_number" as RelayerChallengeColumns, false, []); //sla limit to avoid unparsed hex SLAs
        const expected = [
            {
                id: '5C4oqR3Y1bU7ZRLpsnF2FDLQHY4KCtZC9z64MFsWAd3mgnN4',
                stake: '0.8',
                bonded: true,
                slashed: false,
                lifetime_sla: '0',
                block_count: '0'
            },
            {
                id: '5C5WeqVx1HnC56YKKrhCxDYCbVL77gFy5rbr65VjC97ogPkX',
                stake: '0.8',
                bonded: true,
                slashed: false,
                lifetime_sla: '0',
                block_count: '0'
            },
            {
                id: '5C8QtNSRU8BgZbnx9Zfu5Do4MopJH1ocPmdogqU1UcXUMorN',
                stake: '0.8',
                bonded: true,
                slashed: false,
                lifetime_sla: '0',
                block_count: '0'
            },
            {
                id: '5C8YH53Q2EL7ZS9kato5wbBqJduXUiZoGxZwQtuS6gUK65eS',
                stake: '0.8',
                bonded: true,
                slashed: false,
                lifetime_sla: '0',
                block_count: '0'
            },
            {
                id: '5CDiu7iWKrCRcjiKWmtBDwk51UfjnoCaYEmmofegLkKjGBMG',
                stake: '100',
                bonded: true,
                slashed: false,
                lifetime_sla: '0',
                block_count: '0'
            },
        ];
        assert.deepEqual(relayers, expected as unknown as RelayerData[]);
        return false;
        //TODO: fix relayer SLA in database
    });
});
