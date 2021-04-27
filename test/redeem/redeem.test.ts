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

    it("should return the latest 3 redeems", async () => {
        const pagedRedeems = await getPagedRedeems(
            0,
            3,
            "block_number" as RedeemColumns,
            false,
            [],
            "testnet" as BtcNetworkName
        );
        const expected = [
            {
                id: '38cb69f6b698077b38d7ac7d084c058123426cc28030e1b5468c9f855952f272',
                requester: '5FYfd4ad2eXVQTDH91stzT78T2mn1i2CtPPGKfgRahKpfCcd',
                amountPolkaBTC: '0.45279134',
                feePolkabtc: '0.00227533',
                dotPremium: '0',
                creation: '674212',
                timestamp: '1618760280002',
                btcAddress: '2MxeZfFqfLu3vt4u8aTiZb7xKLmDpcikdyF',
                vaultDotAddress: '5DXr7zcyLjcZmapipiDRKKe3X9an6s3JRuJCM8QNXEqepRMS',
                btcTxId: '',
                confirmations: undefined,
                btcBlockHeight: 0,
                completed: false,
                cancelled: false,
                reimbursed: false,
                isExpired: false
            },
            {
                id: '36d3c33650ece4e00985e38f1eaa6b772d35db7973b5fa3709e144c1110e1805',
                requester: '5FYfd4ad2eXVQTDH91stzT78T2mn1i2CtPPGKfgRahKpfCcd',
                amountPolkaBTC: '0.001592',
                feePolkabtc: '0.000008',
                dotPremium: '0.1187632',
                creation: '674203',
                timestamp: '1618760226000',
                btcAddress: '2MxeZfFqfLu3vt4u8aTiZb7xKLmDpcikdyF',
                vaultDotAddress: '5EqncXtDo93yRgHQTFxvfkQFFrt85UTmh8WjLMaGsvyZV174',
                btcTxId: '',
                confirmations: undefined,
                btcBlockHeight: 0,
                completed: false,
                cancelled: false,
                reimbursed: false,
                isExpired: false
            },
            {
                id: '667ef709025504c00f28e893f2295356503ce21e578a1fae7d54c544d1ebe8f4',
                requester: '5FYfd4ad2eXVQTDH91stzT78T2mn1i2CtPPGKfgRahKpfCcd',
                amountPolkaBTC: '0.20895',
                feePolkabtc: '0.00105',
                dotPremium: '15.58767',
                creation: '674192',
                timestamp: '1618760160000',
                btcAddress: '2MxeZfFqfLu3vt4u8aTiZb7xKLmDpcikdyF',
                vaultDotAddress: '5EqncXtDo93yRgHQTFxvfkQFFrt85UTmh8WjLMaGsvyZV174',
                btcTxId: '',
                confirmations: undefined,
                btcBlockHeight: 0,
                completed: false,
                cancelled: false,
                reimbursed: false,
                isExpired: false
            }
        ]
        return assert.deepEqual(pagedRedeems, expected);
    });
});
