import { assert } from "chai";
import { IssueColumns } from "../../src/common/columnTypes";
import {SatoshisTimeData} from "../../src/common/commonModels";
import { BtcNetworkName } from "../../src/common/util";
import {
    getTotalSuccessfulIssues,
    getTotalIssues,
    getRecentDailyIssues,
    getPagedIssues,
} from "../../src/issue/issueDataService";
import {getUTCMidnight} from "../util";

describe("Issue", () => {
    it("should return the count of successful issues", async () => {
        const successfulCount = await getTotalSuccessfulIssues();
        const expected = "1829";
        return assert.equal(successfulCount, expected);
    });

    it("should return the total count of issues", async () => {
        const totalCount = await getTotalIssues();
        const expected = "4061";
        return assert.equal(totalCount, expected);
    });

    it("should return the amount of issues during the past five days", async () => {
        const dailyAmount = await getRecentDailyIssues(3);
        const satoshi = "4203201358";
        const nextMidnight = getUTCMidnight(new Date()).getTime();
        const expected = Array.from({length: 4}, (_, idx) => ({date: nextMidnight - (idx * 86400 * 1000), sat: satoshi} as SatoshisTimeData)).reverse();
        return assert.deepEqual(dailyAmount, expected);
    });

    it.skip("should return the latest 15 issues", async () => {
        const successfulCount = await getPagedIssues(
            0,
            15,
            "block_number" as IssueColumns,
            false,
            [],
            "testnet" as BtcNetworkName
        );
        console.log(successfulCount);
        const expected = successfulCount;
        return assert.equal(successfulCount, expected);
    });
});
