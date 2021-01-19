import { Pool } from "pg";

const pool = new Pool({ ssl: { rejectUnauthorized: false } });

export async function getSuccessfulIssues(): Promise<string> {
    try {
        const res = await pool.query("select count(*) from v_parachain_executed_issues");
        console.log(res.rows[0]);
        return res.rows[0].count;
    }
    catch (e) {
        console.error(e);
        throw e;
    }
}
