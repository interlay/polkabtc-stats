import { assert } from "chai";
import { IssueColumns } from "../../src/common/columnTypes";
import { SatoshisTimeData } from "../../src/common/commonModels";
import { BtcNetworkName } from "../../src/common/util";
import {
    getTotalSuccessfulIssues,
    getTotalIssues,
    getRecentDailyIssues,
    getPagedIssues,
} from "../../src/issue/issueDataService";
import { getUTCMidnight } from "../util";
import { getTypeORMConnection } from "../../src/common/ormConnection";

getTypeORMConnection(); //side-effect: creates the TypeORM connection

describe("Issue", () => {
    it("should return the count of successful issues", async () => {
        const successfulCount = await getTotalSuccessfulIssues();
        const expected = "1504";
        return assert.equal(successfulCount, expected);
    });

    it("should return the total count of issues", async () => {
        const totalCount = await getTotalIssues([]);
        const expected = 3516;
        return assert.equal(totalCount, expected);
    });

    it("should return the amount of issues during the past five days", async () => {
        const dailyAmount = await getRecentDailyIssues(3);
        const satoshi = 3093882237;
        const nextMidnight = getUTCMidnight(new Date()).getTime();
        const expected = Array.from(
            { length: 4 },
            (_, idx) =>
                ({
                    date: nextMidnight - idx * 86400 * 1000,
                    sat: satoshi,
                } as SatoshisTimeData)
        ).reverse();
        return assert.deepEqual(dailyAmount, expected);
    });

    it("should return the latest 3 issues", async () => {
        const issues = await getPagedIssues(
            0,
            3,
            "block_number" as IssueColumns,
            false,
            [],
            "testnet" as BtcNetworkName
        );
        const expected = [
            {
                id:
                    "dde1997619ae6198d2d9150c24c5d5666145136dca967f88a12d4bd974bd0a14",
                amountBTC: "0.0001005",
                requester: "5DhXBayVxJYxdkHTKzLcGVF1A1VJhemAju1t3hWavY42wXXo",
                feePolkabtc: "0.0000005",
                griefingCollateral: "0.000007601",
                vaultWalletPubkey:
                    "031d58786aa389b1bfa70fa9a3e2024c1c2c1f66aa4eb9449e14fce5b89ec10a4a",
                creation: 667012,
                timestamp: "1618717080000",
                vaultBTCAddress: "tb1qujm7glqv5q4qtngz0h5w85g3qe8r2al6rs4a3d",
                vaultDOTAddress:
                    "5GMv2dMkizpti6vJqgKHWRh132hgzxg4Ba2BkSj5cSSWf2jh",
                btcTxId:
                    "f2e4d00e474cf24c59157f0027af26741086a83160f78e4969ecc8ac5f15f54b",
                confirmations: undefined,
                btcBlockHeight: 0,
                completed: true,
                cancelled: false,
                requestedRefund: false,
                executedAmountBTC: "0.0001005",
                refundBtcAddress: "",
                refundAmountBTC: "",
            },
            {
                id:
                    "c605b899287547cfbd3e56560cf713b0b9baa4bf988e86ea0a61fd5aac78b2c2",
                amountBTC: "0.00001005",
                requester: "5DhXBayVxJYxdkHTKzLcGVF1A1VJhemAju1t3hWavY42wXXo",
                feePolkabtc: "0.00000005",
                griefingCollateral: "0.0000007601",
                vaultWalletPubkey:
                    "02c8a2399c920f231ee54c559893f897a5e82d854e793ec232825b84fb9cadd26c",
                creation: 666967,
                timestamp: "1618716810000",
                vaultBTCAddress: "tb1q04jp0xjgcc2xy75xc8va9829286day7tmgfl2p",
                vaultDOTAddress:
                    "5CAxoMfhGu9W9ziSTiEVtyXy47mkHJBe9Zxw1JhwQPP7Sb9S",
                btcTxId:
                    "84f5a0765247944e9b343f3a41b396984e796bf1752fbfdf25bfd1b060d337a1",
                confirmations: undefined,
                btcBlockHeight: 0,
                completed: true,
                cancelled: false,
                requestedRefund: false,
                executedAmountBTC: "0.00001005",
                refundBtcAddress: "",
                refundAmountBTC: "",
            },
            {
                id:
                    "98ef39208dec7162236f6a0a121098cfff72cde5b4c748ace9056e8ea9cf12b3",
                amountBTC: "0.00021108",
                requester: "5F1VzWH9g9hA9yAvv45UTWhogw9uKWyVCEo6KezMFW41Pg7Q",
                feePolkabtc: "0.00000105",
                griefingCollateral: "0.0000152377",
                vaultWalletPubkey:
                    "031a07541fdaca331c2d29fa837f8bcb78a61af9db7d55a1cc3a57ca4fea289771",
                creation: 641814,
                timestamp: "1618563948002",
                vaultBTCAddress: "tb1qy6ak60wkhmkdz4vts3gd9y3lynwd0llxu0p4t2",
                vaultDOTAddress:
                    "5DP1Wz2WSc9QdKndtDXNNwzbcBPQNhXLSTgKsMpRin4yt1Pi",
                btcTxId: "",
                confirmations: undefined,
                btcBlockHeight: 0,
                completed: false,
                cancelled: true,
                requestedRefund: false,
                executedAmountBTC: "",
                refundBtcAddress: "",
                refundAmountBTC: "",
            },
        ];
        return assert.deepEqual(issues, expected);
    });
});
