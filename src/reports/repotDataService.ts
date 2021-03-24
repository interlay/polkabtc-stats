import pool from "../common/pool";
import logFn from "../common/logger";
import { AccountStats } from "./reportModels";

export const logger = logFn({ name: "reportDataService" });

export async function getAccountStats(): Promise<AccountStats> {
    try {
        const total = await pool.query(`
            select count(*) from (
                select distinct requester as account_id from v_parachain_data_request_issue
                union
                select distinct requester as account_id from v_parachain_redeem_request
                union
                select distinct relayer_id as account_id from v_parachain_stakedrelayer_register
                union
                select distinct vault_id as account_id from v_parachain_vault_registration
            ) as users
        `);
        const full = await pool.query(`
            select count(*) from
                (select distinct requester as account_id from v_parachain_redeem_execute
                intersect
                select distinct requester_id as account_id from v_parachain_data_execute_issue) c
        `);
        const onlyIssue = await pool.query(`
            select count(*) from
                (select distinct requester_id as account_id from v_parachain_data_execute_issue
                except
                select distinct requester as account_id from v_parachain_redeem_request) c
        `);
        const abandonedIssue = await pool.query(`
            select count(*) from
                (select distinct requester as account_id from v_parachain_data_request_issue
                except
                select distinct requester_id as account_id from v_parachain_data_execute_issue) c
        `);
        return {
            totalUsers: total.rows[0].count,
            fullProcessUsers: full.rows[0].count,
            onlyIssuedUsers: onlyIssue.rows[0].count,
            abandonedIssueUsers: abandonedIssue.rows[0].count,
        };
    } catch (e) {
        logger.error(e);
        throw e;
    }
}
