import {assert} from "chai";
import {BlockColumns} from "../../src/common/columnTypes";
import {BtcBlock} from "../../src/relayBlocks/blockModel";
import {getPagedBlocks, totalRelayedBlocks} from "../../src/relayBlocks/blockService";

describe("Blocks", () => {
    it("should get the total count of submitted blocks", async () => {
        const total = await totalRelayedBlocks();
        const expected = "5854";
        assert.equal(total, expected);
    });

    it("should get the latest 5 blocks", async () => {
        const submissions = await getPagedBlocks(0, 5, "hash" as BlockColumns, false);
        const expected = [
            {
                height: "1939488",
                hash: "000413a2b38e441fbbadc18c91d936e01f3e02059645ef210800000000000000",
                relay_ts: new Date("2021-03-08T14:17:36.000Z")
            },
            {
                height: "1938787",
                hash: "000f829c21d5bbcb3cb3c9429753254dc6099839150f35c10a00000000000000",
                relay_ts: new Date("2021-03-04T00:22:24.000Z")
            },
            {
                height: "1939586",
                hash: "001f09f45a4edd06a9e6a14e0b92a35e74e561ba26047ed30a00000000000000",
                relay_ts: new Date("2021-03-09T08:22:48.000Z")
            },
            {
                height: "1968876",
                hash: "002748d09809e478e2931a630b5e82af15d98a2e2d5b52f51000000000000000",
                relay_ts: new Date("2021-03-31T01:45:06.000Z")
            },
            {
                height: "1968649",
                hash: "002963b34861c4501dd61f455571d7c7f19f9d930267d9763e00000000000000",
                relay_ts: new Date("2021-03-30T06:02:24.000Z")
            },
        ];
        assert.deepEqual(submissions, expected as unknown as BtcBlock[]);
    });
});
