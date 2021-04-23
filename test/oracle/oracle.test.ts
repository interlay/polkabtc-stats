import {assert} from "chai";
import {getLatestSubmission, getLatestSubmissionForEachOracle} from "../../src/oracle/oracleDataService";

const namesMap = new Map([["5FPBT2BVVaLveuvznZ9A1TUtDcbxK5yvvGcMTJxgFmhcWGwj", "BAND"], ["5H8zjSWfzMn86d1meeNrZJDj3QZSvRjKxpTfuVaZ46QJZ4qs", "Interlay"]]);

describe("Oracle", () => {
    it("should get the latest submissions from every oracle", async () => {
        const submissions = await getLatestSubmissionForEachOracle(3600 * 1000, "feed", namesMap);
        const expected = [
            {
                id: '5FPBT2BVVaLveuvznZ9A1TUtDcbxK5yvvGcMTJxgFmhcWGwj',
                source: 'BAND',
                feed: 'feed',
                lastUpdate: new Date(1618788012027),
                exchangeRate: '1520.180307481',
                online: false
            },
            {
                id: '5H8zjSWfzMn86d1meeNrZJDj3QZSvRjKxpTfuVaZ46QJZ4qs',
                source: 'Interlay',
                feed: 'feed',
                lastUpdate: new Date(1618787580021),
                exchangeRate: '1518',
                online: false
            }
        ];
        assert.deepEqual(submissions, expected);
    });

    it("should get the latest oracle submission", async () => {
        const submission = await getLatestSubmission(3600 * 1000, "feed", namesMap);
        const expected = {
            id: '5FPBT2BVVaLveuvznZ9A1TUtDcbxK5yvvGcMTJxgFmhcWGwj',
            source: 'BAND',
            feed: 'feed',
            lastUpdate: new Date(1618788012027),
            exchangeRate: '1520.180307481',
            online: false
        };
        assert.deepEqual(submission, expected)
    });
});
