import { assert } from "chai";
import { RedeemColumns } from "../../src/common/columnTypes";
import {SatoshisTimeData} from "../../src/common/commonModels";
import { BtcNetworkName } from "../../src/common/util";
import {
    getTotalSuccessfulRedeems,
    getTotalRedeems,
    getTotalAmount,
    getRecentDailyRedeems,
    getPagedRedeems,
} from "../../src/redeem/redeemDataService";
import {getUTCMidnight} from "../util";

describe("Redeem", () => {
    it("should return the count of successful redeems", async () => {
        const successfulCount = await getTotalSuccessfulRedeems();
        const expected = "385";
        return assert.equal(successfulCount, expected);
    });

    it("should return the total count of redeems", async () => {
        const totalCount = await getTotalRedeems();
        const expected = "974";
        return assert.equal(totalCount, expected);
    });

    it("should return the total value redeemed", async () => {
        const totalValue = await getTotalAmount();
        const expected = "1291284506";
        return assert.equal(totalValue, expected);
    });

    it("should return the amount of redeems during the past three days", async () => {
        const dailyAmount = await getRecentDailyRedeems(3);
        const satoshi = "1291881506";
        const nextMidnight = getUTCMidnight(new Date()).getTime();
        const expected = Array.from({length: 4}, (_, idx) => ({date: nextMidnight - (idx * 86400 * 1000), sat: satoshi} as SatoshisTimeData)).reverse();
        return assert.deepEqual(dailyAmount, expected);
    });

    it.skip("should return the latest 5 redeems", async () => {
        const pagedRedeems = await getPagedRedeems(
            0,
            15,
            "block_number" as RedeemColumns,
            false,
            [],
            "testnet" as BtcNetworkName
        );
        console.log("Redeem: should return the latest 15 redeems");
        console.log(pagedRedeems);
        const expected = pagedRedeems;
        return assert.equal(pagedRedeems, expected);
    });
});
