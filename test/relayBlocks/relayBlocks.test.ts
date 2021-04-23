import {assert} from "chai";
import {BlockColumns} from "../../src/common/columnTypes";
import {BtcBlock} from "../../src/relayBlocks/blockModel";
import {getPagedBlocks, totalRelayedBlocks} from "../../src/relayBlocks/blockService";

describe("Blocks", () => {
    it("should get the total count of submitted blocks", async () => {
        const total = await totalRelayedBlocks();
        const expected = "34762";
        assert.equal(total, expected);
    });

    it("should get the latest 15 blocks", async () => {
        const submissions = await getPagedBlocks(0, 15, "hash" as BlockColumns, false);
        const expected = [
            {
                height: "1955295",
                hash: 'fffe4a1eaec78b714bac249885b30269e41a6fbec0410f1413a4000000000000',
                relay_ts: new Date("2021-03-24T03:06:24.000Z")
            },
            {
                height: "1940755",
                hash: 'fffd54e226efa2095f3e7e3fa281735523ba39511379bdc50900000000000000',
                relay_ts: new Date("2021-03-18T18:23:48.000Z")
            },
            {
                height: "1940421",
                hash: 'fffa353b4026131c694e8239e39c181d53c7133608f016750100000000000000',
                relay_ts: new Date("2021-03-16T02:58:18.000Z")
            },
            {
                height: "1952096",
                hash: 'fff9ad14826fd062f3efa0d1fc6cf43a90aa8422804ebaccdd7e010000000000',
                relay_ts: new Date("2021-03-24T01:43:48.000Z")
            },
            {
                height: "1968063",
                hash: 'fff9306bf6a6eb510a0ce3002c7f984f32a9f259598668481500000000000000',
                relay_ts: new Date("2021-03-28T07:33:06.000Z")
            },
            {
                height: "1951060",
                hash: 'fff61c46bff94cd433a721fabbf3c752857cd0f743653fbd3906000000000000',
                relay_ts: new Date("2021-03-24T01:16:36.000Z")
            },
            {
                height: "1964337",
                hash: 'fff46a582f4f83bc876b51198810ab53316f4bb1ee288d649c01000000000000',
                relay_ts: new Date("2021-03-24T12:27:12.000Z")
            },
            {
                height: "1939565",
                hash: 'fff3d36af8eb8641ce9b2ebb3cdc91fcbd5a1b5944c34fb71300000000000000',
                relay_ts: new Date("2021-03-09T04:20:42.000Z")
            },
            {
                height: "1942326",
                hash: 'fff3503b38e7d0214c3859c117487a4bdc2aca2629427fa9e551f84c00000000',
                relay_ts: new Date("2021-03-23T21:50:24.000Z")
            },
            {
                height: "1951046",
                hash: 'ffee43bdc130435faaf19894c663514cd99dc9c201e246f9e670000000000000',
                relay_ts: new Date("2021-03-24T01:16:06.001Z")
            },
            {
                height: "1947198",
                hash: 'ffeb527b89b231987b395b80425967e28cdbaf8582973ad5c79a010000000000',
                relay_ts: new Date("2021-03-23T23:46:42.000Z")
            },
            {
                height: "1963597",
                hash: 'ffe8985cd59dfd00e5bcc05fba085500f57f6bd7631281729400000000000000',
                relay_ts: new Date("2021-03-24T07:41:48.000Z")
            },
            {
                height: "1951961",
                hash: 'ffe8950f49b82dd7f1c8b203b6a2ac7a8d5fb4953de3238d3c3c000000000000',
                relay_ts: new Date("2021-03-24T01:40:36.000Z")
            },
            {
                height: "1938802",
                hash: 'ffe7277350de6b67f44b9d4d6c3c96a97dac6bb1f079c7b71400000000000000',
                relay_ts: new Date("2021-03-04T02:41:06.000Z")
            },
            {
                height: "1964164",
                hash: 'ffe598845bf6cb10710eaac35afeb020b261481eb64e460ff803000000000000',
                relay_ts: new Date("2021-03-24T11:20:12.000Z")
            }
        ];
        assert.deepEqual(submissions, expected as unknown as BtcBlock[]);
    });
});
