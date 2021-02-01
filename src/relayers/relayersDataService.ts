import { RelayerCountTimeData} from "./relayersModel";
import { runPerDayQuery } from "../common/util";

export async function getRecentDailyRelayers(
    daysBack: number
): Promise<RelayerCountTimeData[]> {
    try {
        return (
            await runPerDayQuery(
                daysBack,
                (i, ts) =>
                `SELECT
                    ${i} AS idx,
                    reg - dereg AS value
                FROM
                    (
                        SELECT
                            COUNT(relayer_id) AS reg
                        FROM v_parachain_stakedrelayer_register
                        WHERE block_ts < '${ts}'
                    ) as r,
                    (
                        SELECT
                            COUNT(relayer_id) AS dereg
                        FROM v_parachain_stakedrelayer_deregister
                        WHERE block_ts < '${ts}'
                    ) as d`
            )
        ).map((row) => ({ date: row.date, count: row.value }));
    } catch (e) {
        console.error(e);
        throw e;
    }
}
